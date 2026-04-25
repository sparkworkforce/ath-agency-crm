import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

/** Verify cron secret using timing-safe comparison to prevent timing attacks. */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || !authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const expected = `Bearer ${cronSecret}`
  if (expected.length !== authHeader.length) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const isValid = timingSafeEqual(Buffer.from(expected), Buffer.from(authHeader))
  if (!isValid) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  return null
}
