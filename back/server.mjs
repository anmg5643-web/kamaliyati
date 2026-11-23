import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import connectDB from './config/db.js'
import Product from './models/Product.js'
import Admin from './models/Admin.js'
import Cart from './models/Cart.js'
import Order from './models/Order.js'
import User from './models/User.js'
import { hashPassword, verifyPassword } from './utils/password.js'
import { products as starterProducts } from '../front/src/data/products.js'
import productRoutes from './routes/productRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import authRoutes from './routes/authRoutes.js'
import imageRoutes from './routes/imageRoutes.js'

const root = fileURLToPath(new URL('.', import.meta.url))
dotenv.config({ path: resolve(root, '.env') })
const dist = resolve(root, '..', 'front', 'dist')
const port = Number(process.env.PORT || 3001)
const app = express()
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' }
let databaseConnectCode = null

function safeDatabaseErrorCode(error) {
  const serverErrors = [...(error?.reason?.servers?.values?.() || [])]
  const candidates = serverErrors.flatMap((server) => [server.error?.code, server.error?.codeName, server.error?.cause?.code])
  return candidates.find((code) => typeof code === 'string') || error.codeName || error.code || error.name || 'CONNECTION_ERROR'
}

function safeDatabaseServerSummary(error) {
  return [...(error?.reason?.servers?.entries?.() || [])].map(([address, server]) => {
    const code = server.error?.code || server.error?.codeName || server.error?.cause?.code || server.error?.name || 'UNKNOWN'
    return `${address}=${code}`
  }).join(', ')
}

function safeDatabaseErrorMessage(error) {
  return String(error?.message || '')
    .replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi, 'mongodb://[REDACTED]')
    .slice(0, 500)
}

app.disable('x-powered-by')
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use('/uploads', express.static(resolve(root, 'uploads'), { fallthrough: false, maxAge: '1d' }))
app.use(express.json({ limit: '32kb' }))
app.use(morgan('dev'))
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }))
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }))
app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1
  res.status(connected ? 200 : 503).json({
    ok: connected,
    database: connected ? 'connected' : 'disconnected',
    databaseError: databaseConnectCode,
  })
})
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next()
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'قاعدة البيانات غير متصلة حالياً. الباك يعمل ويحاول الاتصال مجدداً.',
      code: databaseConnectCode,
    })
  }
  next()
})
app.use('/api/auth', authRoutes)
app.use('/api/images', imageRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)

app.use((err, _req, res, _next) => {
  console.error('API error:', err.message)
  res.status(err.status || 500).json({ error: err.status ? err.message : 'صار خطأ في الخادم.' })
})

app.use(async (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'المسار غير موجود.' })
  if (!existsSync(dist)) return res.status(404).json({ error: 'الواجهة غير مبنية. شغّل npm run build.' })
  let requested
  try { requested = decodeURIComponent(req.path === '/' ? '/index.html' : req.path) }
  catch { return res.status(400).end() }
  const file = resolve(dist, `.${requested}`)
  if (!file.startsWith(`${dist}${sep}`) && file !== resolve(dist, 'index.html')) return res.status(403).end()
  try {
    if ((await stat(file)).isFile()) {
      res.type(mime[extname(file)] || 'application/octet-stream')
      return res.send(await readFile(file))
    }
  } catch {}
  res.type(mime['.html']).send(await readFile(resolve(dist, 'index.html')))
})

async function seedProductsIfEmpty() {
  if (await Product.exists()) return
  await Product.insertMany(starterProducts.map((product) => ({ ...product, storeId: product.id })), { ordered: true })
  console.log(`Added ${starterProducts.length} starter products to the Kamaliyati database.`)
}

async function ensureStoreCollections() {
  const models = [Product, Cart, Order, User, Admin]
  for (const model of models) {
    const collectionName = model.collection.collectionName
    const exists = await mongoose.connection.db
      .listCollections({ name: collectionName }, { nameOnly: true })
      .hasNext()
    if (!exists) await model.createCollection()
  }
}

async function createAdminFromEnvironment() {
  const username = String(process.env.ADMIN_USERNAME || '').trim()
  const password = String(process.env.ADMIN_PASSWORD || '')
  if (!username || !password) {
    console.warn('Admin login is not initialized. Set ADMIN_USERNAME and ADMIN_PASSWORD in back/.env.')
    return
  }
  if (password.length < (process.env.NODE_ENV === 'production' ? 16 : 12)) {
    throw new Error(`ADMIN_PASSWORD must be at least ${process.env.NODE_ENV === 'production' ? 16 : 12} characters long.`)
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set a random JWT_SECRET of at least 32 characters in back/.env.')
  const existingAdmin = await Admin.findOne({ username }).select('+passwordHash')
  if (existingAdmin) {
    if (!(await verifyPassword(password, existingAdmin.passwordHash))) {
      existingAdmin.passwordHash = await hashPassword(password)
      await existingAdmin.save()
      console.log('Admin password synchronized from environment.')
    }
    return
  }
  if (await Admin.exists()) throw new Error('ADMIN_USERNAME does not match the existing admin account; refusing to create another admin.')
  await Admin.create({ username, passwordHash: await hashPassword(password) })
  console.log(`Admin account ${username} initialized.`)
}

createServer(app).listen(port, '0.0.0.0', () => console.log(`Kamaliyati API listening on port ${port}`))

async function initializeDatabase() {
  while (true) {
    try {
      if (mongoose.connection.readyState !== 1) await connectDB()
      databaseConnectCode = null
      await ensureStoreCollections()
      await seedProductsIfEmpty()
      await createAdminFromEnvironment()
      console.log('Kamaliyati database initialization complete.')
      return
    } catch (error) {
      const reason = safeDatabaseErrorCode(error)
      databaseConnectCode = reason
      const servers = safeDatabaseServerSummary(error)
      const detail = safeDatabaseErrorMessage(error)
      console.error(`MongoDB is not ready (${reason})${servers ? ` [${servers}]` : ''}${detail ? `: ${detail}` : ''}; retrying in 5 seconds.`)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
  }
}

void initializeDatabase()
