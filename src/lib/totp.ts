import { createHmac } from 'crypto'
import { redis } from './rate-limit'

const DIGITS = 6
const PERIOD = 30

export function generateSecret(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return base32Encode(bytes)
}

export function generateTOTP(secret: string, time?: number): string {
  const counter = Math.floor((time ?? Date.now() / 1000) / PERIOD)
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(0, 0)
  buf.writeUInt32BE(counter, 4)
  const hmac = createHmac('sha1', base32Decode(secret)).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code = ((hmac[offset] & 0x7f) << 24 | hmac[offset + 1] << 16 | hmac[offset + 2] << 8 | hmac[offset + 3]) % 10 ** DIGITS
  return code.toString().padStart(DIGITS, '0')
}

export function verifyTOTP(secret: string, token: string): boolean {
  const now = Date.now() / 1000
  // Check current and adjacent windows for clock skew
  for (const offset of [-1, 0, 1]) {
    if (generateTOTP(secret, now + offset * PERIOD) === token) return true
  }
  return false
}

/** Verify TOTP with replay protection via Redis. Rejects codes used within 90s. */
export async function verifyTOTPWithReplay(secret: string, token: string, userId: string): Promise<boolean> {
  if (!verifyTOTP(secret, token)) return false
  if (!redis) return true // No Redis = skip replay check (dev only)
  const key = `totp:used:${userId}:${token}`
  const exists = await redis.get(key)
  if (exists) return false // Replay detected
  await redis.set(key, '1', { ex: 90 })
  return true
}

export function getTOTPUri(secret: string, email: string, issuer = 'CobraHub'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=${DIGITS}&period=${PERIOD}`
}

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(data: Uint8Array): string {
  let result = '', bits = 0, value = 0
  for (const byte of data) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) { bits -= 5; result += B32[(value >> bits) & 31] }
  }
  if (bits > 0) result += B32[(value << (5 - bits)) & 31]
  return result
}

function base32Decode(str: string): Buffer {
  let bits = 0, value = 0
  const out: number[] = []
  for (const c of str.toUpperCase()) {
    const i = B32.indexOf(c)
    if (i === -1) continue
    value = (value << 5) | i
    bits += 5
    if (bits >= 8) { bits -= 8; out.push((value >> bits) & 255) }
  }
  return Buffer.from(out)
}
