import Admin from '../models/Admin.js'
import { verifyPassword } from '../utils/password.js'
import { createAdminToken } from '../utils/tokens.js'

export async function login(req, res) {
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')
  if (!username || !password) return res.status(400).json({ error: 'اكتب اسم المستخدم وكلمة المرور.' })
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    return res.status(503).json({ error: 'إعداد JWT_SECRET غير مكتمل في back/.env.' })
  }
  const admin = await Admin.findOne({ username }).select('+passwordHash')
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' })
  }
  const token = createAdminToken({ id: admin.id, username: admin.username }, process.env.JWT_SECRET)
  res.json({ token, admin: { id: admin.id, username: admin.username } })
}
