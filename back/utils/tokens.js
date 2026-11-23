import { createHmac, timingSafeEqual } from 'node:crypto'

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

export function createAdminToken(payload, secret) {
  const now = Math.floor(Date.now() / 1000)
  const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ ...payload, iat: now, exp: now + 8 * 60 * 60 })}`
  const signature = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${signature}`
}

export function verifyAdminToken(token, secret) {
  const [header, body, signature, extra] = String(token || '').split('.')
  if (!header || !body || !signature || extra) throw new Error('Invalid token')
  const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest()
  const actual = Buffer.from(signature, 'base64url')
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid signature')
  const tokenHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'))
  if (tokenHeader.alg !== 'HS256' || tokenHeader.typ !== 'JWT') throw new Error('Invalid algorithm')
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Expired token')
  return payload
}
