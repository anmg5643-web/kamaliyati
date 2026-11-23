import Cart from '../models/Cart.js'
import { cartTotal, normalizeCartItems, validCartId } from '../utils/cart.js'

const response = (cartId, items = [], updatedAt = null) => ({ cart: { id: cartId, items, total: cartTotal(items), updatedAt } })
const badCartId = (id) => !validCartId(id)

export async function getCart(req, res) {
  const cartId = String(req.query.cartId || '')
  if (badCartId(cartId)) return res.status(400).json({ error: 'معرّف السلة غير صالح.' })
  const cart = await Cart.findOne({ cartId }).lean()
  res.json(response(cartId, cart?.items || [], cart?.updatedAt || null))
}

export async function saveCart(req, res) {
  const cartId = String(req.query.cartId || '')
  if (badCartId(cartId)) return res.status(400).json({ error: 'معرّف السلة غير صالح.' })
  const items = await normalizeCartItems(req.body?.items)
  if (!items.length) {
    await Cart.deleteOne({ cartId })
    return res.json(response(cartId))
  }
  const cart = await Cart.findOneAndUpdate(
    { cartId },
    { $set: { items, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
    { upsert: true, new: true, runValidators: true },
  ).lean()
  res.json(response(cartId, cart.items, cart.updatedAt))
}

export async function clearCart(req, res) {
  const cartId = String(req.query.cartId || '')
  if (badCartId(cartId)) return res.status(400).json({ error: 'معرّف السلة غير صالح.' })
  await Cart.deleteOne({ cartId })
  res.json(response(cartId))
}
