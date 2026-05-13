import Link from 'next/link'
import { signOutAction } from '@/app/actions'

type TaskbarProps = {
  isLoggedIn: boolean
  displayName?: string
  email?: string
  showAdminLink?: boolean
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M20.4 5.7a5 5 0 0 0-7.1 0L12 7l-1.3-1.3a5 5 0 0 0-7.1 7.1L12 21l8.4-8.2a5 5 0 0 0 0-7.1Z" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M5 6h16l-2 8H7L5 3H2" />
      <path d="M8 20a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 8 20ZM18 20a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 18 20Z" />
    </svg>
  )
}

export default function Taskbar({ isLoggedIn, displayName, email, showAdminLink }: TaskbarProps) {
  const name = displayName || 'Akun'

  return (
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
        {showAdminLink && <Link href="/admin">Admin</Link>}
      </nav>

      <div className="header-actions">
        <Link href="/wishlist" className="icon-button" aria-label="Wishlist">
          <HeartIcon />
        </Link>
        <Link href="/keranjang" className="icon-button" aria-label="Keranjang">
          <CartIcon />
        </Link>

        {isLoggedIn ? (
          <details className="account-menu">
            <summary className="account-summary" aria-label="Menu akun">
              <span className="account-name">{name}</span>
              <span className="account-chevron" aria-hidden="true">▾</span>
            </summary>
            <div className="account-popover" role="menu">
              <div className="account-meta">
                <strong>{name}</strong>
                {email && <span>{email}</span>}
              </div>
              <div className="account-links">
                <Link href="/akun">Akun Saya</Link>
                {showAdminLink && <Link href="/admin">Dashboard Admin</Link>}
                <form action={signOutAction}>
                  <button type="submit">Logout</button>
                </form>
              </div>
            </div>
          </details>
        ) : (
          <Link href="/login" className="market-button">Login/Daftar</Link>
        )}
      </div>
    </header>
  )
}
