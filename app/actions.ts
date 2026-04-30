'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/catalog'

async function getUserOrRedirect(next = '/toko') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Pelanggan Botani Mart',
  })

  return { supabase, user }
}

async function requireAdmin() {
  const { supabase, user } = await getUserOrRedirect('/admin')
  const { data } = await supabase
    .from('admins')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!data) {
    redirect('/toko')
  }

  return { supabase, user }
}

export async function addToCart(formData: FormData) {
  const productId = String(formData.get('product_id') ?? '')

  if (!productId) {
    redirect('/toko')
  }

  const { supabase, user } = await getUserOrRedirect('/toko')
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('profile_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id)
  } else {
    await supabase.from('cart_items').insert({
      profile_id: user.id,
      product_id: productId,
      quantity: 1,
    })
  }

  revalidatePath('/toko')
  revalidatePath('/keranjang')
}

export async function updateCartQuantity(formData: FormData) {
  const itemId = String(formData.get('item_id') ?? '')
  const intent = String(formData.get('intent') ?? '')
  const currentQuantity = Number(formData.get('quantity') ?? 1)
  const { supabase, user } = await getUserOrRedirect('/keranjang')

  if (!itemId) {
    redirect('/keranjang')
  }

  if (intent === 'remove' || currentQuantity <= 1 && intent === 'decrease') {
    await supabase.from('cart_items').delete().eq('id', itemId).eq('profile_id', user.id)
  } else {
    const nextQuantity = intent === 'increase' ? currentQuantity + 1 : Math.max(1, currentQuantity - 1)
    await supabase
      .from('cart_items')
      .update({ quantity: nextQuantity })
      .eq('id', itemId)
      .eq('profile_id', user.id)
  }

  revalidatePath('/keranjang')
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const categoryId = String(formData.get('category_id') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const imageUrl = String(formData.get('image_url') ?? '').trim()
  const pickupMethod = String(formData.get('pickup_method') ?? 'Ambil di toko').trim()
  const price = Number(formData.get('price') ?? 0)
  const stock = Number(formData.get('stock') ?? 0)

  if (!name || !categoryId || price <= 0) {
    redirect('/admin?status=invalid')
  }

  const slug = `${slugify(name)}-${Date.now().toString(36)}`
  const { error } = await supabase.from('products').insert({
    category_id: categoryId,
    name,
    slug,
    description,
    price,
    stock,
    image_url: imageUrl || '/cat-bibit-buah.jpg',
    pickup_method: pickupMethod,
  })

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  revalidatePath('/toko')
  redirect('/admin?status=created')
}
