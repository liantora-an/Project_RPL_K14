import Image from 'next/image'
import Link from 'next/link'
import { signOutAction } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'

const stats = [
  { eyebrow: 'Sejak Tahun', value: '2018', caption: 'Hingga kini' },
  { eyebrow: 'Sudah Mencapai', value: '100+', caption: 'Pelanggan' },
  { eyebrow: 'Memiliki', value: '50+', caption: 'Jenis Tanaman' },
  { eyebrow: 'Dengan Rating', value: '4.6 ★', caption: 'di Google Maps' },
]

const categories = [
  { label: 'Bibit Buah', img: '/cat-bibit-buah.jpg' },
  { label: 'Pupuk & Pestisida', img: '/cat-pupuk.jpg' },
  { label: 'Pot & Alat Berkebun', img: '/cat-pot.jpg' },
  { label: 'Media Tanam', img: '/cat-media-tanam.jpg' },
  { label: 'Tanaman Hias', img: '/cat-tanaman-hias.jpg' },
  { label: 'Tabulampot', img: '/cat-tanaman-buah.jpg' },
  { label: 'Benih, Inovasi IPB', img: '/tentang-3.jpg' },
]

const bestsellers = [
  {
    name: 'Bibit Buah Mangga',
    price: 'Rp. 20.000/5 pack',
    category: 'Bibit Buah',
    img: '/cat-tanaman-buah.jpg',
  },
  {
    name: 'Bunga Matahari',
    price: 'Rp. 56.000',
    category: 'Tanaman Hias',
    img: '/cat-tanaman-hias.jpg',
  },
  {
    name: 'Bibit Alpukat',
    price: 'Rp. 23.000/5 pack',
    category: 'Bibit Buah',
    img: '/cat-bibit-buah.jpg',
  },
]

const activities = [
  {
    title: 'Sambutan Rektor di Botani Mart',
    img: '/tentang-2.jpg',
    date: '04/04/2026',
    author: 'Johan Santoso',
    desc: 'Kegiatan Botani Mart bagi masyarakat Kebun Cibanteng dan lingkungan kampus.',
  },
  {
    title: 'Kunjungan Mahasiswa IPB ke Botani Mart',
    img: '/kegiatan-1.jpg',
    date: '23/04/2026',
    author: 'Dani Yoga M.',
    desc: 'Mahasiswa IPB melakukan visitasi dan belajar langsung tentang budidaya tanaman.',
  },
]

const testimonials = [
  {
    name: 'Nazwa Chaya',
    role: 'Mahasiswa',
    img: '/tentang-2.jpg',
    text: 'Setiap kali saya beli tanaman, selalu sangat fresh. Hasil dan bibitnya pun sangat bagus. Top rekomendasi!',
  },
  {
    name: 'Liawati Tomo',
    role: 'Wiraswasta',
    img: '/tentang-3.jpg',
    text: 'Harganya terjangkau, panennya bagus, tokonya juga sangat lengkap. Akan beli terus disini suatu hari!',
  },
]

function CartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 6h16l-2 8H7L5 3H2" />
      <path d="M8 20a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 8 20ZM18 20a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 18 20Z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M20.4 5.7a5 5 0 0 0-7.1 0L12 7l-1.3-1.3a5 5 0 0 0-7.1 7.1L12 21l8.4-8.2a5 5 0 0 0 0-7.1Z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
    : { data: null }
  const displayName = profile?.full_name || user?.email || ''

  return (
    <main className="home-page">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Botani Mart">
          <span>BOTANI</span>
          <em>mart</em>
        </Link>

        <nav className="main-nav" aria-label="Navigasi utama">
          <Link href="/">Beranda</Link>
          <Link href="/toko">Toko</Link>
          <Link href="/kegiatan">Kegiatan</Link>
          <Link href="/informasi">Informasi</Link>
          <Link href="/kontak">Kontak</Link>
        </nav>

        <div className="header-actions">
          {user && (
            <span className="header-user">{displayName}</span>
          )}
          <Link href="/wishlist" className="icon-button" aria-label="Wishlist">
            <HeartIcon />
          </Link>
          <Link href="/keranjang" className="icon-button" aria-label="Keranjang">
            <CartIcon />
          </Link>
          <Link href={user ? '/akun' : '/login'} className="market-button">
            {user ? 'Akun' : 'Login/Daftar'}
          </Link>
          {user && (
            <form action={signOutAction}>
              <button type="submit" className="market-button">Logout</button>
            </form>
          )}
        </div>
      </header>

      <section className="hero-section">
        <Image src="/hero-bg.jpg" alt="Toko Botani Mart" fill priority sizes="100vw" className="section-bg" />
        <div className="hero-overlay" />
        <div className="page-shell hero-content">
          <p>Selamat datang di Website Botani Mart!</p>
          <h1>Temukan berbagai macam tanaman segar yang siap kamu tanam di Rumah.</h1>
          <span>Botani Mart menyediakan layanan pengiriman jika ke beberapa daerah dan pengambilan langsung</span>
          <Link href="/toko" className="solid-button">
            Belanja Sekarang
          </Link>
        </div>
        <div className="page-shell stats-row">
          {stats.map((stat) => (
            <article key={stat.eyebrow} className="stat-card">
              <p>{stat.eyebrow}</p>
              <strong>{stat.value}</strong>
              <span>{stat.caption}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section page-shell">
        <h2>Tentang Botani Mart</h2>
        <div className="about-grid">
          <div className="about-copy">
            <p>
              Botani Mart adalah pusat penjualan tanaman dan produk pertanian yang dikelola oleh Institut Pertanian Bogor. Tempat ini menyediakan berbagai kebutuhan pertanian seperti bibit tanaman buah unggul, tanaman hias, benih sayur, pupuk, hingga media tanam, sehingga pengunjung dapat berbelanja sambil mengenal tanaman sebagai bagian penting dari alam.
            </p>
            <div className="contact-list">
              <span>Jalan Raya Dramaga 205, Babakan, Bogor, Jawa Barat</span>
              <span>08.00 - 16.00 (Setiap Hari)</span>
            </div>
          </div>
          <div className="about-photo">
            <Image src="/tentang-1.jpg" alt="Pengunjung Botani Mart memilih tanaman" fill sizes="(max-width: 768px) 100vw, 420px" />
          </div>
        </div>
      </section>

      <section className="testimonial-section">
        <Image src="/auth-bg.jpg" alt="" fill sizes="100vw" className="section-bg" />
        <div className="soft-overlay" />
        <div className="page-shell testimonial-content">
          <h2>Testimoni Pelanggan</h2>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <article key={item.name} className="testimonial-card">
                <Image src={item.img} alt={item.name} width={112} height={112} />
                <div>
                  <p>&ldquo;{item.text}&rdquo;</p>
                  <strong>★★★★★</strong>
                  <span>{item.name}</span>
                  <small>{item.role}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="category-section page-shell">
        <h2>Kategori Produk</h2>
        <p>Berikut adalah produk yang tersedia di toko kami</p>
        <div className="category-grid">
          {categories.map((category) => (
            <Link key={category.label} href={`/toko?kategori=${encodeURIComponent(category.label)}`} className="category-card">
              <Image src={category.img} alt={category.label} width={220} height={160} />
              <span>{category.label}</span>
            </Link>
          ))}
        </div>
        <Link href="/toko" className="outline-button">
          Belanja Sekarang
        </Link>
      </section>

      <section className="products-section page-shell">
        <div className="section-heading">
          <div>
            <h2>Best Seller</h2>
            <p>Produk yang paling banyak dibeli di Botani Mart</p>
          </div>
          <Link href="/toko" className="text-link">
            Lihat Semua <ArrowIcon />
          </Link>
        </div>

        <div className="product-grid">
          {bestsellers.map((product) => (
            <article key={product.name} className="product-card">
              <div className="product-image">
                <Image src={product.img} alt={product.name} fill sizes="(max-width: 768px) 100vw, 280px" />
                <button type="button" aria-label={`Simpan ${product.name}`}>
                  <HeartIcon />
                </button>
              </div>
              <div className="product-body">
                <span>{product.category}</span>
                <h3>{product.name}</h3>
                <strong>{product.price}</strong>
                <p>★★★★★ <small>4.9</small></p>
                <div className="buy-row">
                  <Link href="/keranjang" className="cart-button" aria-label={`Masukkan ${product.name} ke keranjang`}>
                    <CartIcon />
                  </Link>
                  <Link href="/toko" className="buy-button">
                    Beli Sekarang
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="activity-section">
        <div className="page-shell">
          <div className="section-heading light">
            <div>
              <h2>Kegiatan Terbaru</h2>
              <p>Aktivitas dan Informasi terbaru dari Botani Mart</p>
            </div>
            <Link href="/kegiatan" className="text-link">
              Lihat Semua <ArrowIcon />
            </Link>
          </div>

          <div className="activity-grid">
            {activities.map((activity) => (
              <article key={activity.title} className="activity-card">
                <Image src={activity.img} alt={activity.title} width={230} height={170} />
                <div>
                  <h3>{activity.title}</h3>
                  <p>{activity.desc}</p>
                  <span>{activity.date} • {activity.author}</span>
                  <Link href="/kegiatan">Lihat selengkapnya</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="visit-section">
        <Image src="/auth-bg.jpg" alt="Area toko Botani Mart" fill sizes="100vw" className="section-bg" />
        <div className="visit-overlay" />
        <div className="visit-content">
          <h2>Kunjungi Toko Kami!</h2>
          <p>Botani Mart memiliki toko yang berlokasi di Dramaga, Bogor</p>
          <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">
            Klik link <ArrowIcon />
          </a>
        </div>
      </section>
    </main>
  )
}
