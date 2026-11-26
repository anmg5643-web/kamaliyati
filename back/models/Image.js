import mongoose from 'mongoose'

const imageSchema = new mongoose.Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
}, { timestamps: true })

export default mongoose.model('Image', imageSchema)