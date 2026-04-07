import { prisma } from '../prisma'
import { resend } from '../resend'

const MAGIC_LINK_EXPIRY_MS = 48 * 60 * 60 * 1000 // 48 hours
const MAX_LOGIN_ATTEMPTS = 5
const MAX_LOCK_DELAY_MS = 30_000 // 30 seconds

// ─── Magic Link ───────────────────────────────────────────

export async function generateMagicLinkToken(userId: string): Promise<string> {
  // Invalidate any existing active magic links for this user
  await prisma.magicLink.updateMany({
    where: {
      userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  })

  const token = crypto.randomUUID()
  await prisma.magicLink.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + MAGIC_LINK_EXPIRY_MS),
    },
  })

  return token
}

export async function validateMagicLinkToken(
  token: string
): Promise<{ valid: true; userId: string } | { valid: false; reason: 'invalid' | 'used' | 'expired' }> {
  const link = await prisma.magicLink.findUnique({ where: { token } })

  if (!link) return { valid: false, reason: 'invalid' }
  if (link.usedAt) return { valid: false, reason: 'used' }
  if (link.expiresAt < new Date()) return { valid: false, reason: 'expired' }

  return { valid: true, userId: link.userId }
}

export async function invalidateMagicLinkToken(token: string): Promise<void> {
  await prisma.magicLink.update({
    where: { token },
    data: { usedAt: new Date() },
  })
}

export async function sendMagicLinkEmail(
  email: string,
  token: string,
  clientName: string
): Promise<void> {
  const agencyName = process.env.NEXT_PUBLIC_AGENCY_NAME ?? 'la agencia'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const magicLinkUrl = `${baseUrl}/api/auth/magic-link?token=${token}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: `Acceso a tu Portal — ${agencyName}`,
    html: `
      <p>Hola ${clientName},</p>
      <p>Tu agente ha creado tu acceso al portal de seguimiento de integración ATH Business.</p>
      <p>Haz clic en el siguiente enlace para acceder a tu portal:</p>
      <p><a href="${magicLinkUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Acceder a mi Portal</a></p>
      <p>Este enlace expira en <strong>48 horas</strong> y solo puede usarse una vez.</p>
      <p>Si no solicitaste este acceso, puedes ignorar este mensaje.</p>
    `,
  })
}

// ─── Rate Limiting (DB-backed) ────────────────────────────

export async function checkIfLocked(email: string): Promise<void> {
  const record = await prisma.loginAttempt.findUnique({ where: { email } })
  if (record?.lockedUntil && record.lockedUntil > new Date()) {
    throw new Error('RATE_LIMITED')
  }
}

export async function checkAndIncrementLoginAttempts(email: string): Promise<void> {
  const record = await prisma.loginAttempt.upsert({
    where: { email },
    update: {
      attempts: { increment: 1 },
      lastAttempt: new Date(),
    },
    create: { email, attempts: 1 },
  })

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    const delay = Math.min(record.attempts * 1000, MAX_LOCK_DELAY_MS)
    await prisma.loginAttempt.update({
      where: { email },
      data: { lockedUntil: new Date(Date.now() + delay) },
    })
  }
}

export async function resetLoginAttempts(email: string): Promise<void> {
  await prisma.loginAttempt.upsert({
    where: { email },
    update: { attempts: 0, lockedUntil: null },
    create: { email, attempts: 0 },
  })
}

// ─── Session Management ───────────────────────────────────

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } })
}
