import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
