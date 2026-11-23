import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export async function uploadProductImage(req, res) {
  const image = req.body
  if (!Buffer.isBuffer(image) || image.length < 16 || image.length > 8 * 1024 * 1024) {
    return res.status(400).json({ error: 'ارفع صورة من نوع JPG أو PNG أو WebP وبحجم أقل من 8 ميغابايت.' })
  }
  let ext
  if (image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff) ext = '.jpg'
  else if (image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ext = '.png'
  else if (image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP') ext = '.webp'
  else return res.status(400).json({ error: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.' })

  const filename = `${randomUUID()}${ext}`
  const uploads = resolve(process.env.UPLOADS_DIR || resolve(fileURLToPath(new URL('..', import.meta.url)), 'uploads'))
  await mkdir(uploads, { recursive: true })
  await writeFile(resolve(uploads, filename), image, { flag: 'wx' })
  res.status(201).json({ imageUrl: `/uploads/${filename}` })
}
