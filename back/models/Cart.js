import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  brand: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  qty: { type: Number, required: true, min: 1, max: 20 },
}, { _id: false })

const cartSchema = new mongoose.Schema({
  cartId: { type: String, required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true })

export default mongoose.model('Cart', cartSchema)
