import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { rateLimit, redis } from '@/lib/rate-limit'
import { verifyTOTPWithReplay } from '@/lib/totp'
import { z } from 'zod'

const VerifySchema = z.object({ token: z.string().length(6).regex(/^\d+$/) })

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = VerifySchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Read pending secret from server-side storage
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const pendingSecret = (user as any)?.totpPending
  const activeSecret = (user as any)?.totpSecret

  // Login-time 2FA verification (user already has active TOTP)
  if (activeSecret && !pendingSecret) {
    if (!await verifyTOTPWithReplay(activeSecret, result.data.token, session.user.id)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }
    if (redis) await redis.set(`2fa:verified:${(session.user as any).jti}`, '1', { ex: 86400 })
    return NextResponse.json({ ok: true })
  }

  // Initial setup confirmation (activating TOTP for the first time)
  if (!pendingSecret) return NextResponse.json({ error: 'No pending 2FA setup. Start setup first.' }, { status: 400 })

  if (!await verifyTOTPWithReplay(pendingSecret, result.data.token, session.user.id)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  // Activate: move pending to active, clear pending
  await (prisma.user as any).update({
    where: { id: session.user.id },
    data: { totpSecret: pendingSecret, totpPending: null },
  }).catch(() => {})

  // Mark 2FA as verified for this session (24h TTL)
  if (redis) await redis.set(`2fa:verified:${(session.user as any).jti}`, '1', { ex: 86400 })

  return NextResponse.json({ ok: true })
}
