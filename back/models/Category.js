import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  label: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model('Category', categorySchema)