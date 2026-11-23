import Product from '../models/Product.js'

export async function listProducts(_req, res) {
  const products = await Product.find().sort({ storeId: 1 }).lean()
  res.json({ products: products.map(({ storeId, _id, __v, ...product }) => ({ id: storeId, ...product })) })
}

export async function getProductById(req, res) {
  const product = await Product.findOne({ storeId: Number(req.params.id) }).lean()
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود.' })
  const { storeId, _id, __v, ...data } = product
  res.json({ product: { id: storeId, ...data } })
}

export async function listAdminProducts(_req, res) {
  res.json({ products: await Product.find().sort({ storeId: 1 }).lean() })
}

const allowedProductFields = ['name', 'brand', 'category', 'price', 'oldPrice', 'rating', 'reviews', 'inStock', 'badge', 'image', 'description']
function cleanProduct(input = {}) {
  return Object.fromEntries(allowedProductFields.filter((key) => key in input).map((key) => [key, input[key]]))
}

export async function createProduct(req, res) {
  const data = cleanProduct(req.body)
  if (!data.name || !data.category || !Number.isFinite(Number(data.price))) {
    return res.status(400).json({ error: 'اسم المنتج والقسم والسعر مطلوبة.' })
  }
  const latest = await Product.findOne().sort({ storeId: -1 }).select('storeId').lean()
  const product = await Product.create({ ...data, price: Number(data.price), storeId: (latest?.storeId || 0) + 1 })
  res.status(201).json({ product })
}

export async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, cleanProduct(req.body), { new: true, runValidators: true })
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود.' })
  res.json({ product })
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) return res.status(404).json({ error: 'المنتج غير موجود.' })
  res.json({ ok: true })
}
