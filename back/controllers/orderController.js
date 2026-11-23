import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { cartTotal, validCartId } from '../utils/cart.js'
import mongoose from 'mongoose'

export async function createOrder(req, res) {
  const name = String(req.body?.name || '').trim()
  const phone = String(req.body?.phone || '').trim()
  const address = String(req.body?.address || '').trim()
  const notes = String(req.body?.notes || '').trim()
  const cartId = String(req.body?.cartId || '')
  if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'اكتب الاسم بشكل صحيح.' })
  if (!/^[+\d][\d\s()-]{5,28}$/.test(phone)) return res.status(400).json({ error: 'اكتب رقم هاتف صحيح.' })
  if (address.length < 4 || address.length > 240) return res.status(400).json({ error: 'اكتب المدينة والعنوان بشكل صحيح.' })
  if (notes.length > 500) return res.status(400).json({ error: 'الملاحظات طويلة جداً.' })
  if (!validCartId(cartId)) return res.status(400).json({ error: 'معرّف السلة غير صالح.' })

  const cart = await Cart.findOne({ cartId }).lean()
  if (!cart?.items.length) return res.status(400).json({ error: 'السلة فارغة.' })
  const items = cart.items.map(({ id, name: productName, brand, price, qty, image }) => ({
    productId: id, name: productName, brand, unitPrice: price, qty, image,
  }))
  const orderId = `KM-${Date.now().toString(36).toUpperCase()}`
  await User.findOneAndUpdate(
    { phone },
    { $set: { name, address } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  )
  const order = await Order.create({
    orderId,
    customer: { name, phone, address, notes },
    items,
    total: cartTotal(cart.items),
  })
  await Cart.deleteOne({ cartId })
  res.status(201).json({ order: { id: order.orderId, total: order.total } })
}

export async function listOrders(_req, res) {
  const orders = await Order.find().sort({ createdAt: -1 }).lean()
  res.json({ orders })
}

export async function updateOrderStatus(req, res) {
  const allowed = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled']
  if (!allowed.includes(req.body?.status)) return res.status(400).json({ error: 'حالة الطلب غير صالحة.' })
  const query = mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : { orderId: req.params.id }
  const order = await Order.findOneAndUpdate(query, { status: req.body.status }, { new: true, runValidators: true })
  if (!order) return res.status(404).json({ error: 'الطلب غير موجود.' })
  res.json({ order })
}
