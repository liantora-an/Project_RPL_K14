import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { addToCart, signOutAction } from '@/app/actions'
import { fallbackCategories, formatRupiah, normalizeProducts, type Category, type Product } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function getCatalog() {
  const supabase = await createClient()
  const [{ data: categories }, { data: products, error }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase
      .from('products')
      .select('id, category_id, name, slug, description, price, stock, image_url, rating, pickup_method, created_at, categories(name, slug)')
      .order('created_at', { ascending: false }),
  ])

  return {
    categories: categories?.length ? categories as Category[] : fallbackCategories,
    products: !error && products?.length ? normalizeProducts(products) : [],
  }
}

function StoreHeader({ isLoggedIn, displayName }: { isLoggedIn: boolean; displayName: string }) {
  return (
    <header className="store-header">
      <Link href="/" className="brand store-brand" aria-label="Botani Mart">
        <span>BOTANI</span>
        <em>mart</em>
      </Link>
      <nav className="store-nav" aria-label="Navigasi toko">
        <Link href="/">Beranda</Link>
        <Link href="/toko" className="active">Toko</Link>
        <Link href="/kegiatan">Kegiatan</Link>
        <Link href="/informasi">Informasi</Link>
        <Link href="/kontak">Kontak</Link>
      </nav>
      <div className="store-actions">
        {isLoggedIn && displayName && (
          <span className="store-user">{displayName}</span>
        )}
        <Link href="/wishlist" className="store-icon" aria-label="Wishlist">♡</Link>
        <Link href="/keranjang" className="store-icon cart-symbol" aria-label="Keranjang">▾</Link>
        <Link href={isLoggedIn ? '/akun' : '/login'} className="store-login">{isLoggedIn ? 'Akun' : 'Daftar/Masuk'}</Link>
        {isLoggedIn && (
          <form action={signOutAction}>
            <button type="submit" className="store-login">Logout</button>
          </form>
        )}
      </div>
    </header>
  )
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="catalog-card">
      <div className="catalog-image">
        <Image
          src={product.image_url || '/cat-bibit-buah.jpg'}
          alt={product.name}
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
        />
        <button type="button" aria-label={`Simpan ${product.name}`}>♡</button>
      </div>
      <div className="catalog-body">
        <span>{product.categories?.name ?? 'Bibit Buah'}</span>
        <h3>{product.name}</h3>
        <strong>{formatRupiah(Number(product.price))}{product.name.toLowerCase().includes('bibit') ? '/5 pack' : ''}</strong>
        <p>★★★★ <small>★</small> <b>{product.rating ?? 4.9}</b></p>
        <div className="catalog-buy-row">
          <form action={addToCart}>
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="product_slug" value={product.slug} />
            <input type="hidden" name="intent" value="add" />
            <button type="submit" className="catalog-cart" aria-label={`Masukkan ${product.name} ke keranjang`}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 6h16l-2 8H7L5 3H2" />
                <path d="M8 20a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 8 20ZM18 20a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 18 20Z" />
              </svg>
            </button>
          </form>
          <form action={addToCart}>
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="product_slug" value={product.slug} />
            <input type="hidden" name="intent" value="buy" />
            <button type="submit" className="catalog-buy">Beli Sekarang</button>
          </form>
        </div>
      </div>
    </article>
  )
}

export default async function StorePage({ searchParams }: PageProps) {
  const params = await searchParams
  const query = firstParam(params?.q)?.toLowerCase().trim() ?? ''
  const category = firstParam(params?.category) ?? ''
  const sort = firstParam(params?.sort) ?? 'all'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    : { data: null }
  const displayName = profile?.full_name || user?.email || ''
  const { categories, products } = await getCatalog()

  const filteredProducts = products
    .filter((product) => {
      const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.categories?.name.toLowerCase().includes(query)
      const matchesCategory = !category || product.categories?.slug === category
      return matchesQuery && matchesCategory
    })
    .sort((a, b) => {
      if (sort === 'best') return Number(b.rating ?? 0) - Number(a.rating ?? 0)
      if (sort === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return 0
    })

  const displayProducts = filteredProducts.length
    ? Array.from(
        { length: Math.max(8, filteredProducts.length) },
        (_, index) => filteredProducts[index % filteredProducts.length]
      ).filter(Boolean)
    : []

  return (
    <main className="store-page">
      <StoreHeader isLoggedIn={Boolean(user)} displayName={displayName} />

      <section className="store-hero">
        <Image src="/hero-bg.jpg" alt="Botani Mart" fill priority sizes="100vw" />
        <div />
        <h1><span>Selamat berbelanja!</span>Toko/Shop</h1>
      </section>

      <section className="catalog-shell">
        <form action="/toko" className="catalog-search">
          <input name="q" defaultValue={query} placeholder="Cari produk, tanaman, bibit..." />
          <button type="submit" aria-label="Cari produk">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4.2-4.2" />
            </svg>
          </button>
        </form>

        <div className="catalog-tabs">
          <Link href="/toko" className={sort === 'all' ? 'active' : ''}>Semua</Link>
          <Link href="/toko?sort=new" className={sort === 'new' ? 'active' : ''}>Terbaru</Link>
          <Link href="/toko?sort=best" className={sort === 'best' ? 'active' : ''}>Best Seller</Link>
        </div>

        <form action="/toko" className="catalog-filters">
          <select name="category" defaultValue={category}>
            <option value="">Kategori</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>{item.name}</option>
            ))}
          </select>
          <select name="price" defaultValue="">
            <option value="">Harga</option>
            <option value="low">Termurah</option>
            <option value="high">Termahal</option>
          </select>
          <select name="pickup" defaultValue="">
            <option value="">Pengambilan</option>
            <option value="pickup">Ambil di toko</option>
            <option value="delivery">Pengiriman</option>
          </select>
          <button type="submit">Terapkan</button>
        </form>

        <div className="catalog-grid">
          {displayProducts.map((product, index) => (
            <ProductCard key={`${product.id}-${index}`} product={product} />
          ))}
        </div>

        {!displayProducts.length && (
          <div className="empty-cart">
            <h2>Produk belum tersedia</h2>
            <p>Tambah produk di database dulu agar tampil di katalog.</p>
          </div>
        )}

        <nav className="catalog-pagination" aria-label="Pagination katalog">
          <Link href="/toko">←</Link>
          <Link href="/toko" className="current">1</Link>
          <Link href="/toko?page=2">2</Link>
          <Link href="/toko?page=3">3</Link>
          <span>...</span>
          <Link href="/toko?page=10">10</Link>
          <Link href="/toko?page=2">→</Link>
        </nav>
      </section>
    </main>
  )
}
