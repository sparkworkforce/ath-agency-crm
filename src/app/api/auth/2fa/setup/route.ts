import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { generateSecret, getTOTPUri } from '@/lib/totp'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = generateSecret()
  const uri = getTOTPUri(secret, session.user.email ?? '')

  // Store pending secret on user (not yet active until verified)
  await (prisma.user as any).update({ where: { id: session.user.id }, data: { totpPending: secret } }).catch(() => {})

  return NextResponse.json({ secret, uri })
}
