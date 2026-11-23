import mongoose from 'mongoose'

export default async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is missing. Copy .env.example to .env and add your Atlas URI.')
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    family: 4,
    serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 5000),
  })
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}
