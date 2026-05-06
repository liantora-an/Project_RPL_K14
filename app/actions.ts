'use server'

import { randomUUID } from 'crypto'
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function uploadProductImage(supabase: Awaited<ReturnType<typeof createClient>>, file: File) {
  const extension = file.name.split('.').pop() || 'jpg'
  const path = `products/${randomUUID()}.${extension}`

  const { error } = await supabase.storage.from('photo-storage').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from('photo-storage').getPublicUrl(path)
  return data.publicUrl
}

export async function addToCart(formData: FormData) {
  const productId = String(formData.get('product_id') ?? '')
  const productSlug = String(formData.get('product_slug') ?? '')
  const intent = String(formData.get('intent') ?? 'add')

  if (!productId) {
    redirect('/toko')
  }

  const { supabase, user } = await getUserOrRedirect('/toko')
  let resolvedProductId = productId

  if (!isUuid(productId)) {
    if (!productSlug) {
      throw new Error('Invalid product reference. Please reload the catalog.')
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('slug', productSlug)
      .maybeSingle()

    if (productError) {
      throw new Error(productError.message)
    }

    if (!product?.id) {
      throw new Error('Product is not available in the database.')
    }

    resolvedProductId = product.id
  }

  const { data: existing, error: existingError } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('profile_id', user.id)
    .eq('product_id', resolvedProductId)
    .maybeSingle()

  if (existingError) {
    throw new Error(existingError.message)
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + 1 })
      .eq('id', existing.id)

    if (updateError) {
      throw new Error(updateError.message)
    }
  } else {
    const { error: insertError } = await supabase.from('cart_items').insert({
      profile_id: user.id,
      product_id: resolvedProductId,
      quantity: 1,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  revalidatePath('/toko')
  revalidatePath('/keranjang')

  if (intent === 'buy') {
    redirect('/keranjang')
  }
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
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('profile_id', user.id)

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  } else {
    const nextQuantity = intent === 'increase' ? currentQuantity + 1 : Math.max(1, currentQuantity - 1)
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: nextQuantity })
      .eq('id', itemId)
      .eq('profile_id', user.id)

    if (updateError) {
      throw new Error(updateError.message)
    }
  }

  revalidatePath('/keranjang')
}

export async function createProduct(formData: FormData) {
  const { supabase } = await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const categoryId = String(formData.get('category_id') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const imageUrl = String(formData.get('image_url') ?? '').trim()
  const imageFile = formData.get('image')
  const pickupMethod = String(formData.get('pickup_method') ?? 'Ambil di toko').trim()
  const price = Number(formData.get('price') ?? 0)
  const stock = Number(formData.get('stock') ?? 0)

  if (!name || !categoryId || price <= 0) {
    redirect('/admin?status=invalid')
  }

  let resolvedImageUrl = imageUrl

  if (imageFile instanceof File && imageFile.size > 0) {
    resolvedImageUrl = await uploadProductImage(supabase, imageFile)
  }

  const slug = `${slugify(name)}-${Date.now().toString(36)}`
  const { error } = await supabase.from('products').insert({
    category_id: categoryId,
    name,
    slug,
    description,
    price,
    stock,
    image_url: resolvedImageUrl || '/cat-bibit-buah.jpg',
    pickup_method: pickupMethod,
  })

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  revalidatePath('/toko')
  redirect('/admin?status=created')
}

export async function updateProduct(formData: FormData) {
  const { supabase } = await requireAdmin()
  const productId = String(formData.get('product_id') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  const categoryId = String(formData.get('category_id') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const imageUrl = String(formData.get('image_url') ?? '').trim()
  const imageFile = formData.get('image')
  const pickupMethod = String(formData.get('pickup_method') ?? '').trim()
  const priceValue = formData.get('price')
  const stockValue = formData.get('stock')
  const price = Number(priceValue ?? 0)
  const stock = Number(stockValue ?? 0)

  if (!productId) {
    redirect('/admin?status=invalid')
  }

  const updates: Record<string, unknown> = {}

  if (name) updates.name = name
  if (categoryId) updates.category_id = categoryId
  if (description) updates.description = description
  if (pickupMethod) updates.pickup_method = pickupMethod
  if (Number.isFinite(price) && price > 0) updates.price = price
  if (Number.isFinite(stock) && stock >= 0) updates.stock = stock
  if (imageUrl) updates.image_url = imageUrl

  if (imageFile instanceof File && imageFile.size > 0) {
    updates.image_url = await uploadProductImage(supabase, imageFile)
  }

  if (!Object.keys(updates).length) {
    redirect('/admin?status=invalid')
  }

  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  revalidatePath('/toko')
  redirect('/admin?status=updated')
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await requireAdmin()
  const productId = String(formData.get('product_id') ?? '').trim()

  if (!productId) {
    redirect('/admin?status=invalid')
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  revalidatePath('/toko')
  redirect('/admin?status=deleted')
}

export async function createCategory(formData: FormData) {
  const { supabase } = await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()

  if (!name) {
    redirect('/admin?status=invalid')
  }

  const slug = slugify(name)
  const { error } = await supabase.from('categories').insert({ name, slug })

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  revalidatePath('/toko')
  redirect('/admin?status=category-created')
}

export async function updateCategory(formData: FormData) {
  const { supabase } = await requireAdmin()
  const categoryId = String(formData.get('category_id') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()

  if (!categoryId || !name) {
    redirect('/admin?status=invalid')
  }

  const slug = slugify(name)
  const { error } = await supabase
    .from('categories')
    .update({ name, slug })
    .eq('id', categoryId)

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  revalidatePath('/toko')
  redirect('/admin?status=category-updated')
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin()
  const categoryId = String(formData.get('category_id') ?? '').trim()

  if (!categoryId) {
    redirect('/admin?status=invalid')
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  revalidatePath('/toko')
  redirect('/admin?status=category-deleted')
}

export async function createPromotion(formData: FormData) {
  const { supabase } = await requireAdmin()
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const discountPercent = Number(formData.get('discount_percent') ?? 0)
  const startsAt = String(formData.get('starts_at') ?? '').trim()
  const endsAt = String(formData.get('ends_at') ?? '').trim()
  const active = formData.get('active') === 'on'

  if (!title || !Number.isFinite(discountPercent) || discountPercent <= 0) {
    redirect('/admin?status=invalid')
  }

  const { error } = await supabase.from('promotions').insert({
    title,
    description,
    discount_percent: discountPercent,
    starts_at: startsAt || null,
    ends_at: endsAt || null,
    active,
  })

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  redirect('/admin?status=promo-created')
}

export async function updatePromotion(formData: FormData) {
  const { supabase } = await requireAdmin()
  const promotionId = String(formData.get('promotion_id') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const discountPercent = Number(formData.get('discount_percent') ?? 0)
  const startsAt = String(formData.get('starts_at') ?? '').trim()
  const endsAt = String(formData.get('ends_at') ?? '').trim()
  const active = formData.get('active') === 'on'

  if (!promotionId || !title || !Number.isFinite(discountPercent) || discountPercent <= 0) {
    redirect('/admin?status=invalid')
  }

  const { error } = await supabase
    .from('promotions')
    .update({
      title,
      description,
      discount_percent: discountPercent,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      active,
    })
    .eq('id', promotionId)

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  redirect('/admin?status=promo-updated')
}

export async function deletePromotion(formData: FormData) {
  const { supabase } = await requireAdmin()
  const promotionId = String(formData.get('promotion_id') ?? '').trim()

  if (!promotionId) {
    redirect('/admin?status=invalid')
  }

  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', promotionId)

  if (error) {
    redirect('/admin?status=failed')
  }

  revalidatePath('/admin')
  redirect('/admin?status=promo-deleted')
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect('/akun')
  const fullName = String(formData.get('full_name') ?? '').trim()
  const phoneNumber = String(formData.get('phone_number') ?? '').trim()
  const address = String(formData.get('address') ?? '').trim()

  if (!fullName && !phoneNumber && !address) {
    redirect('/akun?status=invalid')
  }

  const updates: Record<string, string | null> = {}

  if (fullName) updates.full_name = fullName
  if (phoneNumber || phoneNumber === '') updates.phone_number = phoneNumber || null
  if (address || address === '') updates.address = address || null

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    redirect('/akun?status=failed')
  }

  revalidatePath('/akun')
  redirect('/akun?status=updated')
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
