import Image from 'next/image'
import { redirect } from 'next/navigation'
import {
  createCategory,
  createProduct,
  createPromotion,
  deleteCategory,
  deleteProduct,
  deletePromotion,
  updateCategory,
  updateProduct,
  updatePromotion,
} from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import { formatRupiah, normalizeProducts, type Category, type Product } from '@/lib/catalog'
import Taskbar from '@/components/Taskbar'

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

  const [{ data: profile }, { data: categories }, { data: products }, { data: promotions }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('products')
      .select('id, category_id, name, slug, description, price, stock, image_url, rating, pickup_method, created_at, categories(name, slug)')
      .order('created_at', { ascending: false }),
    supabase
      .from('promotions')
      .select('id, title, description, discount_percent, starts_at, ends_at, active, created_at')
      .order('created_at', { ascending: false }),
  ])

  return {
    user,
    displayName: profile?.full_name || user.email || '',
    categories: (categories ?? []) as Category[],
    products: normalizeProducts(products),
    promotions: promotions ?? [],
  }
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = firstParam(params?.status)
  const { user, displayName, categories, products, promotions } = await getAdminData()

  return (
    <main className="admin-page">
      <Taskbar
        isLoggedIn
        displayName={displayName}
        email={user.email ?? ''}
        showAdminLink
      />

      <section className="admin-shell">
        <div className="admin-title">
          <div>
            <p>Dashboard Admin</p>
            <h1>Create produk yang ingin dijual</h1>
          </div>
          <span>{user.email}</span>
        </div>

        {status === 'created' && <div className="admin-alert success">Produk berhasil ditambahkan ke katalog.</div>}
        {status === 'updated' && <div className="admin-alert success">Produk berhasil diperbarui.</div>}
        {status === 'deleted' && <div className="admin-alert">Produk berhasil dihapus.</div>}
        {status === 'category-created' && <div className="admin-alert success">Kategori berhasil ditambahkan.</div>}
        {status === 'category-updated' && <div className="admin-alert success">Kategori berhasil diperbarui.</div>}
        {status === 'category-deleted' && <div className="admin-alert">Kategori berhasil dihapus.</div>}
        {status === 'promo-created' && <div className="admin-alert success">Promo berhasil ditambahkan.</div>}
        {status === 'promo-updated' && <div className="admin-alert success">Promo berhasil diperbarui.</div>}
        {status === 'promo-deleted' && <div className="admin-alert">Promo berhasil dihapus.</div>}
        {status === 'invalid' && <div className="admin-alert">Data tidak valid. Mohon periksa kembali.</div>}
        {status === 'failed' && <div className="admin-alert">Aksi gagal. Cek policy Supabase atau koneksi database.</div>}

        <div className="admin-grid">
          <form action={createProduct} className="product-form" encType="multipart/form-data">
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
              Upload Foto
              <input name="image" type="file" accept="image/*" />
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
              {products.slice(0, 8).map((product) => (
                <article key={product.id}>
                  <Image src={product.image_url || '/cat-bibit-buah.jpg'} alt={product.name} width={82} height={72} />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.categories?.name ?? 'Tanaman'} • Stok {product.stock}</span>
                    <p>{formatRupiah(Number(product.price))}</p>
                  </div>
                </article>
              ))}
              {!products.length && (
                <p className="empty-note">Belum ada produk dari database. Tambahkan produk pertama lewat form ini.</p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="admin-shell">
        <div className="admin-title">
          <div>
            <p>Manajemen Kategori</p>
            <h1>Tambah, ubah, dan hapus kategori</h1>
          </div>
        </div>

        <div className="admin-grid">
          <form action={createCategory} className="product-form">
            <label className="wide">
              Nama Kategori
              <input name="name" placeholder="Contoh: Media Tanam" required />
            </label>
            <button type="submit">Tambah Kategori</button>
          </form>

          <aside className="admin-preview">
            <h2>Daftar Kategori</h2>
            <div>
              {categories.map((category) => (
                <article key={category.id}>
                  <div>
                    <strong>{category.name}</strong>
                    <span>Slug: {category.slug}</span>
                  </div>
                  <div className="admin-inline">
                    <form action={updateCategory} className="admin-inline-form">
                      <input type="hidden" name="category_id" value={category.id} />
                      <input name="name" defaultValue={category.name} />
                      <button type="submit">Simpan</button>
                    </form>
                    <form action={deleteCategory}>
                      <input type="hidden" name="category_id" value={category.id} />
                      <button type="submit">Hapus</button>
                    </form>
                  </div>
                </article>
              ))}
              {!categories.length && (
                <p className="empty-note">Belum ada kategori. Tambahkan kategori pertama lewat form ini.</p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="admin-shell">
        <div className="admin-title">
          <div>
            <p>Manajemen Produk</p>
            <h1>Ubah detail, stok, dan foto produk</h1>
          </div>
        </div>

        <div className="admin-list">
          {products.map((product) => (
            <div key={product.id} className="admin-card">
              <form action={updateProduct} className="product-form" encType="multipart/form-data">
                <input type="hidden" name="product_id" value={product.id} />
                <label>
                  Nama Produk
                  <input name="name" defaultValue={product.name} />
                </label>
                <label>
                  Kategori
                  <select name="category_id" defaultValue={product.category_id ?? ''}>
                    <option value="">Tanpa kategori</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Harga
                  <input name="price" type="number" min="1" defaultValue={Number(product.price)} />
                </label>
                <label>
                  Stok
                  <input name="stock" type="number" min="0" defaultValue={Number(product.stock)} />
                </label>
                <label>
                  Foto Produk (URL)
                  <input name="image_url" defaultValue={product.image_url ?? ''} />
                </label>
                <label>
                  Upload Foto
                  <input name="image" type="file" accept="image/*" />
                </label>
                <label>
                  Pengambilan
                  <select name="pickup_method" defaultValue={product.pickup_method ?? 'Ambil di toko'}>
                    <option>Ambil di toko</option>
                    <option>Pengiriman</option>
                    <option>Ambil di toko & pengiriman</option>
                  </select>
                </label>
                <label className="wide">
                  Deskripsi
                  <textarea name="description" rows={3} defaultValue={product.description ?? ''} />
                </label>
                <button type="submit">Simpan Perubahan</button>
              </form>
              <form action={deleteProduct} className="admin-inline-form">
                <input type="hidden" name="product_id" value={product.id} />
                <button type="submit">Hapus Produk</button>
              </form>
            </div>
          ))}

          {!products.length && (
            <div className="admin-preview">
              <p className="empty-note">Belum ada produk. Tambahkan produk dari form di atas.</p>
            </div>
          )}
        </div>
      </section>

      <section className="admin-shell">
        <div className="admin-title">
          <div>
            <p>Manajemen Promo</p>
            <h1>Atur informasi promosi aktif</h1>
          </div>
        </div>

        <div className="admin-grid">
          <form action={createPromotion} className="product-form">
            <label>
              Judul Promo
              <input name="title" placeholder="Contoh: Diskon Musim Tanam" required />
            </label>
            <label>
              Diskon (%)
              <input name="discount_percent" type="number" min="1" max="100" placeholder="10" required />
            </label>
            <label>
              Mulai
              <input name="starts_at" type="datetime-local" />
            </label>
            <label>
              Berakhir
              <input name="ends_at" type="datetime-local" />
            </label>
            <label className="wide">
              Deskripsi
              <textarea name="description" rows={3} placeholder="Tuliskan info promo singkat" />
            </label>
            <label className="wide">
              <input name="active" type="checkbox" defaultChecked /> Aktifkan promo
            </label>
            <button type="submit">Simpan Promo</button>
          </form>

          <aside className="admin-preview">
            <h2>Promo Aktif</h2>
            <div>
              {promotions.map((promo) => (
                <article key={promo.id}>
                  <div>
                    <strong>{promo.title}</strong>
                    <span>Diskon {Number(promo.discount_percent)}%</span>
                    <span>Status: {promo.active ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                  <div className="admin-inline">
                    <form action={updatePromotion} className="admin-inline-form">
                      <input type="hidden" name="promotion_id" value={promo.id} />
                      <input name="title" defaultValue={promo.title} />
                      <input name="discount_percent" type="number" min="1" max="100" defaultValue={Number(promo.discount_percent)} />
                      <input name="starts_at" type="datetime-local" defaultValue={promo.starts_at ? promo.starts_at.slice(0, 16) : ''} />
                      <input name="ends_at" type="datetime-local" defaultValue={promo.ends_at ? promo.ends_at.slice(0, 16) : ''} />
                      <input name="description" defaultValue={promo.description ?? ''} />
                      <label className="admin-checkbox">
                        <input name="active" type="checkbox" defaultChecked={promo.active} /> Aktif
                      </label>
                      <button type="submit">Update</button>
                    </form>
                    <form action={deletePromotion}>
                      <input type="hidden" name="promotion_id" value={promo.id} />
                      <button type="submit">Hapus</button>
                    </form>
                  </div>
                </article>
              ))}
              {!promotions.length && (
                <p className="empty-note">Belum ada promo. Tambahkan promo pertama lewat form ini.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
