import mongoose from 'mongoose'
import Image from '../models/Image.js'

const MAX_BYTES = 2 * 1024 * 1024 // الصورة توصل مضغوطة من الأدمن، فهذا حد أمان

function detectType(image) {
  if (image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff) return 'image/jpeg'
  if (image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png'
  if (image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

export async function uploadProductImage(req, res) {
  const image = req.body
  if (!Buffer.isBuffer(image) || image.length < 16) {
    return res.status(400).json({ error: 'ارفع صورة من نوع JPG أو PNG أو WebP.' })
  }
  if (image.length > MAX_BYTES) {
    return res.status(400).json({ error: 'الصورة كبيرة حتى بعد الضغط. جرّب صورة أصغر.' })
  }
  const contentType = detectType(image)
  if (!contentType) return res.status(400).json({ error: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.' })

  const doc = await Image.create({ data: image, contentType, size: image.length })
  res.status(201).json({ imageUrl: `/api/images/${doc.id}` })
}

export async function getImage(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end()
  const doc = await Image.findById(req.params.id).select('data contentType')
  if (!doc) return res.status(404).end()
  res.set({
    'Content-Type': doc.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  })
  res.send(Buffer.from(doc.data))
}