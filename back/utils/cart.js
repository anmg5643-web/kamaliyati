import Product from '../models/Product.js'

export const validCartId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(value)

export async function normalizeCartItems(input) {
  if (!Array.isArray(input) || input.length > 50) throw Object.assign(new Error('السلة غير صالحة.'), { status: 400 })
  const quantities = new Map()
  for (const entry of input) {
    const id = Number(entry?.id)
    const qty = Number(entry?.qty)
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw Object.assign(new Error('الكمية أو المنتج غير صالح.'), { status: 400 })
    }
    const nextQty = (quantities.get(id) || 0) + qty
    if (nextQty > 20) throw Object.assign(new Error('الحد الأقصى لكل منتج هو 20.'), { status: 400 })
    quantities.set(id, nextQty)
  }
  const products = await Product.find({ storeId: { $in: [...quantities.keys()] } }).lean()
  const byId = new Map(products.map((product) => [product.storeId, product]))
  if (byId.size !== quantities.size) throw Object.assign(new Error('أحد المنتجات غير متوفر حالياً.'), { status: 400 })
  return [...quantities].map(([id, qty]) => {
    const product = byId.get(id)
    if (!product.inStock) throw Object.assign(new Error('أحد المنتجات غير متوفر حالياً.'), { status: 400 })
    return { id, name: product.name, brand: product.brand, price: product.price, image: product.image || '', qty }
  })
}

export const cartTotal = (items) => items.reduce((sum, item) => sum + item.price * item.qty, 0)
