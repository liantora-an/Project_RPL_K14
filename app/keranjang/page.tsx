import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signOutAction, updateCartQuantity } from '@/app/actions'
import { createClient } from '@/lib/supabase/server'
import { formatRupiah } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

type CartItem = {
  id: string
  quantity: number
  products: {
    id: string
    name: string
    price: number
    image_url: string | null
    categories?: { name: string } | null
  } | null
}

async function getCart() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/keranjang')
  }

  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('cart_items')
      .select('id, quantity, products(id, name, price, image_url, categories(name))')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return {
    user,
    displayName: profile?.full_name || user.email || '',
    items: ((data ?? []) as unknown as Array<Omit<CartItem, 'products'> & { products: CartItem['products'] | CartItem['products'][] }>).map((item) => ({
      ...item,
      products: Array.isArray(item.products) ? item.products[0] ?? null : item.products,
    })),
  }
}

export default async function CartPage() {
  const { user, displayName, items } = await getCart()
  const total = items.reduce((sum, item) => sum + Number(item.products?.price ?? 0) * item.quantity, 0)

  return (
    <main className="cart-page">
      <header className="admin-header">
        <Link href="/" className="brand" aria-label="Botani Mart">
          <span>BOTANI</span>
          <em>mart</em>
        </Link>
        <nav>
          <Link href="/toko">Toko</Link>
          <Link href="/keranjang">Keranjang</Link>
          <Link href="/akun">Akun</Link>
        </nav>
        <div className="store-actions">
          <span className="store-user">{displayName}</span>
          <form action={signOutAction}>
            <button type="submit" className="store-login">Logout</button>
          </form>
        </div>
      </header>

      <section className="cart-shell">
        <div className="admin-title">
          <div>
            <p>Keranjang Belanja</p>
            <h1>Produk pilihan kamu</h1>
          </div>
          <span>{user.email}</span>
        </div>

        <div className="cart-grid">
          <div className="cart-list">
            {items.map((item) => (
              <article key={item.id} className="cart-item">
                <Image src={item.products?.image_url || '/cat-bibit-buah.jpg'} alt={item.products?.name ?? 'Produk'} width={128} height={110} />
                <div>
                  <span>{item.products?.categories?.name ?? 'Tanaman'}</span>
                  <h2>{item.products?.name}</h2>
                  <strong>{formatRupiah(Number(item.products?.price ?? 0))}</strong>
                  <div className="quantity-row">
                    <form action={updateCartQuantity}>
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="quantity" value={item.quantity} />
                      <button type="submit" name="intent" value="decrease">-</button>
                    </form>
                    <b>{item.quantity}</b>
                    <form action={updateCartQuantity}>
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="quantity" value={item.quantity} />
                      <button type="submit" name="intent" value="increase">+</button>
                    </form>
                    <form action={updateCartQuantity}>
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="quantity" value={item.quantity} />
                      <button type="submit" name="intent" value="remove" className="remove-button">Hapus</button>
                    </form>
                  </div>
                </div>
              </article>
            ))}

            {!items.length && (
              <div className="empty-cart">
                <h2>Keranjang masih kosong</h2>
                <p>Pilih tanaman dari katalog lalu tekan tombol keranjang.</p>
                <Link href="/toko">Belanja Sekarang</Link>
              </div>
            )}
          </div>

          <aside className="cart-summary">
            <h2>Ringkasan</h2>
            <div>
              <span>Subtotal</span>
              <strong>{formatRupiah(total)}</strong>
            </div>
            <div>
              <span>Total Item</span>
              <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            </div>
            <button type="button">Checkout</button>
          </aside>
        </div>
      </section>
    </main>
  )
}
