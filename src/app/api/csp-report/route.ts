import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked
  const body = await request.json().catch(() => null)
  if (body) logger.warn('CSP violation', { report: body })
  return NextResponse.json({ ok: true })
}
