import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { rateLimit, redis } from '@/lib/rate-limit'
import { verifyTOTPWithReplay, generateBackupCodes, hashBackupCodes, verifyBackupCode } from '@/lib/totp'
import { z } from 'zod'

const VerifySchema = z.object({ token: z.string().min(6).max(8) })

const MAX_2FA_ATTEMPTS = 5
const LOCKOUT_TTL = 900 // 15 minutes

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check 2FA brute-force lockout (atomic: INCR returns new value)
  const attemptKey = `2fa:attempts:${session.user.id}`
  if (redis) {
    const attempts = parseInt((await redis.get(attemptKey)) as string || '0', 10)
    if (attempts >= MAX_2FA_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many failed attempts. Try again later.' }, { status: 429 })
    }
  }

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = VerifySchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const token = result.data.token

  // Read pending secret from server-side storage
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const pendingSecret = (user as any)?.totpPending
  const activeSecret = (user as any)?.totpSecret
  const storedBackupCodes: string[] = (user as any)?.backupCodes ?? []

  // Login-time 2FA verification (user already has active TOTP)
  if (activeSecret && !pendingSecret) {
    const isTotp = /^\d{6}$/.test(token)

    if (isTotp) {
      if (!await verifyTOTPWithReplay(activeSecret, token, session.user.id)) {
        if (redis) { const count = await redis.incr(attemptKey); if (count === 1) await redis.expire(attemptKey, LOCKOUT_TTL) }
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
      }
    } else {
      // Try backup code
      const idx = verifyBackupCode(token, storedBackupCodes, session.user.id)
      if (idx === -1) {
        if (redis) { const count = await redis.incr(attemptKey); if (count === 1) await redis.expire(attemptKey, LOCKOUT_TTL) }
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
      }
      // Consume the backup code atomically (re-read, verify, update in transaction)
      await prisma.$transaction(async (tx) => {
        const freshUser = await tx.user.findUnique({ where: { id: session.user.id }, select: { backupCodes: true } })
        const codes = (freshUser as any)?.backupCodes ?? []
        const freshIdx = verifyBackupCode(token, codes, session.user.id)
        if (freshIdx === -1) throw new Error('Code already consumed')
        const remaining = [...codes]
        remaining.splice(freshIdx, 1)
        await (tx.user as any).update({ where: { id: session.user.id }, data: { backupCodes: remaining } })
      })
    }

    if (redis) await redis.del(attemptKey)
    if (redis) await redis.set(`2fa:verified:${(session.user as any).jti}`, '1', { ex: 86400 })
    return NextResponse.json({ ok: true })
  }

  // Initial setup confirmation (activating TOTP for the first time)
  if (!pendingSecret) return NextResponse.json({ error: 'No pending 2FA setup. Start setup first.' }, { status: 400 })

  if (!await verifyTOTPWithReplay(pendingSecret, token, session.user.id)) {
    if (redis) { const count = await redis.incr(attemptKey); if (count === 1) await redis.expire(attemptKey, LOCKOUT_TTL) }
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  if (redis) await redis.del(attemptKey)

  // Generate backup codes
  const backupCodes = generateBackupCodes()
  const hashedCodes = hashBackupCodes(backupCodes, session.user.id)

  // Activate: move pending to active, store hashed backup codes
  try {
    await (prisma.user as any).update({
      where: { id: session.user.id },
      data: { totpSecret: pendingSecret, totpPending: null, backupCodes: hashedCodes },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to activate 2FA' }, { status: 500 })
  }

  // Mark 2FA as verified for this session (24h TTL)
  if (redis) await redis.set(`2fa:verified:${(session.user as any).jti}`, '1', { ex: 86400 })

  // Return plaintext backup codes (shown once, never again)
  return NextResponse.json({ ok: true, backupCodes }, { headers: { 'Cache-Control': 'no-store, private' } })
}
