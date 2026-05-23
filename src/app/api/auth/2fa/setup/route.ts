import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { generateSecret, getTOTPUri } from '@/lib/totp'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const SetupSchema = z.object({ password: z.string().min(1) })

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = SetupSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Password required' }, { status: 400 })

  // Re-authenticate: verify current password
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true, email: true } })
  if (!user?.password) return NextResponse.json({ error: 'Password not set' }, { status: 400 })

  const valid = await bcrypt.compare(result.data.password, user.password)
  if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 403 })

  const secret = generateSecret()
  const uri = getTOTPUri(secret, user.email ?? session.user.email ?? '')

  // Store pending secret on user (not yet active until verified)
  try {
    await (prisma.user as any).update({ where: { id: session.user.id }, data: { totpPending: secret } })
  } catch {
    return NextResponse.json({ error: 'Failed to save setup' }, { status: 500 })
  }

  return NextResponse.json({ secret, uri }, { headers: { 'Cache-Control': 'no-store, private' } })
}
