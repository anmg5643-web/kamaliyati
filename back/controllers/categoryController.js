import Category from '../models/Category.js'
import Product from '../models/Product.js'

const defaults = [
  ['brakes', 'الفرامل'], ['oils', 'الزيوت'], ['filters', 'الفلاتر'],
  ['electrics', 'البطاريات والإضاءة'], ['accessories', 'الكماليات'],
]

// أول مرة فقط: نزرع الأقسام الحالية عشان المنتجات القديمة تبقى مربوطة بأقسامها
async function seedIfEmpty() {
  if ((await Category.countDocuments()) > 0) return
  try {
    await Category.insertMany(defaults.map(([slug, label], order) => ({ slug, label, order })), { ordered: false })
  } catch { /* لو طلبين جوا في نفس الوقت، الثاني يتجاهل التكرار */ }
}

const cleanLabel = (value) => String(value || '').trim()
const labelError = (label) => (label.length < 2 || label.length > 40 ? 'اكتب اسم القسم (من حرفين إلى 40 حرف).' : '')
const publicCategory = ({ slug, label }) => ({ id: slug, label })

export async function listCategories(_req, res) {
  await seedIfEmpty()
  const categories = await Category.find().sort({ order: 1, createdAt: 1 }).lean()
  res.json({ categories: categories.map(publicCategory) })
}

export async function createCategory(req, res) {
  const label = cleanLabel(req.body?.label)
  const problem = labelError(label)
  if (problem) return res.status(400).json({ error: problem })
  if (await Category.findOne({ label }).lean()) return res.status(400).json({ error: 'يوجد قسم بنفس الاسم.' })
  const last = await Category.findOne().sort({ order: -1 }).select('order').lean()
  const category = await Category.create({
    slug: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    label,
    order: (last?.order ?? -1) + 1,
  })
  res.status(201).json({ category: publicCategory(category) })
}

export async function updateCategory(req, res) {
  const label = cleanLabel(req.body?.label)
  const problem = labelError(label)
  if (problem) return res.status(400).json({ error: problem })
  const clash = await Category.findOne({ label, slug: { $ne: req.params.slug } }).lean()
  if (clash) return res.status(400).json({ error: 'يوجد قسم بنفس الاسم.' })
  const category = await Category.findOneAndUpdate({ slug: req.params.slug }, { label }, { new: true })
  if (!category) return res.status(404).json({ error: 'القسم غير موجود.' })
  res.json({ category: publicCategory(category) })
}

export async function deleteCategory(req, res) {
  const slug = req.params.slug
  if ((await Category.countDocuments()) <= 1) {
    return res.status(400).json({ error: 'لازم يبقى قسم واحد على الأقل.' })
  }
  const used = await Product.countDocuments({ category: slug })
  if (used > 0) {
    return res.status(400).json({ error: `في ${used} منتج داخل هذا القسم. انقلهم لقسم ثاني أو احذفهم أولاً.` })
  }
  const category = await Category.findOneAndDelete({ slug })
  if (!category) return res.status(404).json({ error: 'القسم غير موجود.' })
  res.json({ ok: true })
}