import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  productId: { type: Number, required: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  unitPrice: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'new' },
  customer: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    notes: { type: String, default: '', trim: true },
  },
  items: { type: [orderItemSchema], required: true, validate: (items) => items.length > 0 },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LYD' },
  payment: { type: String, default: 'cash_on_delivery' },
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)
