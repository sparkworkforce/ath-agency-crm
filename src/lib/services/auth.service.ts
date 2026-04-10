import { prisma } from '../prisma'
import { sendEmail, emailButton, esc, type AgencyBranding } from '../email'

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

export async function consumeMagicLinkToken(
  token: string
): Promise<{ valid: true; userId: string } | { valid: false; reason: 'invalid' | 'used' | 'expired' }> {
  // Atomic validate+invalidate in a single transaction to prevent TOCTOU race
  const now = new Date()
  return prisma.$transaction(async (tx) => {
    const link = await tx.magicLink.findUnique({ where: { token } })
    if (!link) return { valid: false as const, reason: 'invalid' as const }
    if (link.usedAt) return { valid: false as const, reason: 'used' as const }
    if (link.expiresAt < now) return { valid: false as const, reason: 'expired' as const }

    await tx.magicLink.update({ where: { id: link.id }, data: { usedAt: now } })
    return { valid: true as const, userId: link.userId }
  })
}

export async function sendMagicLinkEmail(
  email: string,
  token: string,
  clientName: string,
  agency?: AgencyBranding
): Promise<void> {
  const agencyName = agency?.name || 'CobraHub'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const magicLinkUrl = `${baseUrl}/api/auth/magic-link?token=${token}`

  await sendEmail(email, `Acceso a tu Portal — ${agencyName}`,
    `<p>Hola ${esc(clientName)},</p><p>Tu agente ha creado tu acceso al portal de seguimiento de integración ATH Business.</p><p>Haz clic para acceder:</p><p>${emailButton(magicLinkUrl, 'Acceder a mi Portal')}</p><p style="font-size:12px;color:#6b7280">Este enlace expira en 48 horas.</p>`,
    agency
  )
}

// ─── Rate Limiting (DB-backed) ────────────────────────────

export async function checkIfLocked(email: string): Promise<void> {
  const record = await prisma.loginAttempt.findUnique({ where: { email } })
  if (record?.lockedUntil && record.lockedUntil > new Date()) {
    throw new Error('RATE_LIMITED')
  }
}

export async function checkAndIncrementLoginAttempts(email: string): Promise<void> {
  // Check if a previous lock has expired — if so, reset counter
  const existing = await prisma.loginAttempt.findUnique({ where: { email } })
  if (existing?.lockedUntil && existing.lockedUntil <= new Date()) {
    await prisma.loginAttempt.update({
      where: { email },
      data: { attempts: 1, lockedUntil: null, lastAttempt: new Date() },
    })
    return
  }

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
