import { createClient } from './supabase/server'

function getErrorMessage(error, fallback) {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export async function addToCart({ userId, productId, quantity = 1 }) {
  try {
    const supabase = await createClient()
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, price, stock')
      .eq('id', productId)
      .single()

    if (productError) {
      throw new Error(getErrorMessage(productError, 'Failed to fetch product.'))
    }

    if (!product) {
      throw new Error('Product not found.')
    }

    const { data: existingItem, error: existingError } = await supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle()

    if (existingError) {
      throw new Error(getErrorMessage(existingError, 'Failed to read cart item.'))
    }

    if (existingItem) {
      const updatedQuantity = existingItem.quantity + safeQuantity

      const { data: updatedItem, error: updateError } = await supabase
        .from('cart')
        .update({ quantity: updatedQuantity })
        .eq('id', existingItem.id)
        .select('id, user_id, product_id, quantity')
        .single()

      if (updateError) {
        throw new Error(getErrorMessage(updateError, 'Failed to update cart item.'))
      }

      return updatedItem
    }

    const { data: insertedItem, error: insertError } = await supabase
      .from('cart')
      .insert({
        user_id: userId,
        product_id: productId,
        quantity: safeQuantity,
      })
      .select('id, user_id, product_id, quantity')
      .single()

    if (insertError) {
      throw new Error(getErrorMessage(insertError, 'Failed to add cart item.'))
    }

    return insertedItem
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to add to cart.'))
  }
}

export async function getCart(userId) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cart')
      .select(
        'id, quantity, product:products ( id, name, price, image_url )'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(getErrorMessage(error, 'Failed to fetch cart.'))
    }

    return data ?? []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to load cart.'))
  }
}

export async function removeItem({ userId, itemId }) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .eq('id', itemId)

    if (error) {
      throw new Error(getErrorMessage(error, 'Failed to remove cart item.'))
    }

    return { success: true }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to remove item.'))
  }
}

export async function getTotal(userId) {
  try {
    const items = await getCart(userId)

    const total = items.reduce((sum, item) => {
      const price = item.product?.price ?? 0
      return sum + price * item.quantity
    }, 0)

    return total
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Unable to calculate total.'))
  }
}
