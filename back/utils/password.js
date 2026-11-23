import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await scrypt(password, salt, 64)
  return `scrypt$${salt}$${Buffer.from(key).toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [algorithm, salt, expectedHex] = String(stored || '').split('$')
  if (algorithm !== 'scrypt' || !salt || !expectedHex || expectedHex.length !== 128) return false
  const actual = Buffer.from(await scrypt(password, salt, 64))
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
