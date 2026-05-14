import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null

if (!redis && process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
  throw new Error('[FATAL] UPSTASH_REDIS_REST_URL not configured in production. Rate limiting is required.')
}

export { redis }

// 10 requests per 60 seconds per IP
const limiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '60 s') }) : null

// Stricter limiter for auth routes: 5 requests per 60 seconds
const authLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s'), prefix: 'rl:auth' }) : null

/** Extract a non-spoofable IP from the request. Falls back to a global key. */
function getClientIp(request: NextRequest): string {
  // request.ip is set by the platform (Vercel) and cannot be spoofed by the client.
  // x-forwarded-for is only trustworthy behind a known reverse proxy.
  return (request as any).ip ?? request.headers.get('x-real-ip') ?? 'global'
}

export async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
  if (!limiter) return null
  const { success } = await limiter.limit(getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }
  return null
}

export async function rateLimitAuth(request: NextRequest): Promise<NextResponse | null> {
  if (!authLimiter) return null
  const { success } = await authLimiter.limit(getClientIp(request))
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429, headers: { 'Retry-After': '60' } })
  }
  return null
}
