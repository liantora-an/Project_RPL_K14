import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createProduct } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import { fallbackCategories, formatRupiah, type Category, type Product } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

async function getAdminData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!admin) {
    redirect('/toko')
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('products')
      .select('id, category_id, name, slug, description, price, stock, image_url, rating, pickup_method, created_at, categories(name, slug)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  return {
    user,
    categories: categories?.length ? categories as Category[] : fallbackCategories,
    products: products as Product[] | null,
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = firstParam(params?.status)
  const { user, categories, products } = await getAdminData()

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="brand" aria-label="Botani Mart">
          <span>BOTANI</span>
          <em>mart</em>
        </Link>
        <nav>
          <Link href="/toko">Toko</Link>
          <Link href="/keranjang">Keranjang</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </header>

      <section className="admin-shell">
        <div className="admin-title">
          <div>
            <p>Dashboard Admin</p>
            <h1>Create produk yang ingin dijual</h1>
          </div>
          <span>{user.email}</span>
        </div>

        {status === 'created' && <div className="admin-alert success">Produk berhasil ditambahkan ke katalog.</div>}
        {status === 'invalid' && <div className="admin-alert">Nama, kategori, dan harga wajib diisi.</div>}
        {status === 'failed' && <div className="admin-alert">Produk gagal disimpan. Cek policy Supabase atau koneksi database.</div>}

        <div className="admin-grid">
          <form action={createProduct} className="product-form">
            <label>
              Nama Produk
              <input name="name" placeholder="Contoh: Bibit Buah Mangga" required />
            </label>
            <label>
              Kategori
              <select name="category_id" required>
                <option value="">Pilih kategori</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              Harga
              <input name="price" type="number" min="1" placeholder="20000" required />
            </label>
            <label>
              Stok
              <input name="stock" type="number" min="0" placeholder="25" defaultValue="1" />
            </label>
            <label>
              Foto Produk
              <input name="image_url" placeholder="/cat-bibit-buah.jpg" defaultValue="/cat-bibit-buah.jpg" />
            </label>
            <label>
              Pengambilan
              <select name="pickup_method" defaultValue="Ambil di toko">
                <option>Ambil di toko</option>
                <option>Pengiriman</option>
                <option>Ambil di toko & pengiriman</option>
              </select>
            </label>
            <label className="wide">
              Deskripsi
              <textarea name="description" rows={4} placeholder="Tuliskan detail singkat produk..." />
            </label>
            <button type="submit">Simpan Produk</button>
          </form>

          <aside className="admin-preview">
            <h2>Produk Terbaru</h2>
            <div>
              {(products ?? []).map((product) => (
                <article key={product.id}>
                  <Image src={product.image_url || '/cat-bibit-buah.jpg'} alt={product.name} width={82} height={72} />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.categories?.name ?? 'Tanaman'} • Stok {product.stock}</span>
                    <p>{formatRupiah(Number(product.price))}</p>
                  </div>
                </article>
              ))}
              {!products?.length && (
                <p className="empty-note">Belum ada produk dari database. Tambahkan produk pertama lewat form ini.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
