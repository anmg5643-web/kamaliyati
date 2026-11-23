import { verifyAdminToken } from '../utils/tokens.js'

export function protectAdmin(req, res, next) {
  const secret = process.env.JWT_SECRET
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || !secret) return res.status(401).json({ error: 'سجّل الدخول بحساب الإدارة أولاً.' })
  try {
    req.admin = verifyAdminToken(token, secret)
    next()
  } catch {
    res.status(401).json({ error: 'جلسة الإدارة غير صالحة أو انتهت.' })
  }
}
