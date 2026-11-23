import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  storeId: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  brand: { type: String, default: '', trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, min: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews: { type: Number, min: 0, default: 0 },
  inStock: { type: Boolean, default: true },
  badge: { type: String, default: '' },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Product', productSchema)
