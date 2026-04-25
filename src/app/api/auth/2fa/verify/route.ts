import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTOTP } from '@/lib/totp'
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
  if (!pendingSecret) return NextResponse.json({ error: 'No pending 2FA setup. Start setup first.' }, { status: 400 })

  if (!verifyTOTP(pendingSecret, result.data.token)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  // Activate: move pending to active, clear pending
  await (prisma.user as any).update({
    where: { id: session.user.id },
    data: { totpSecret: pendingSecret, totpPending: null },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
