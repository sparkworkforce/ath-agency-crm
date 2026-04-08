import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null

// 10 requests per 60 seconds per IP
const limiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '60 s') }) : null

export async function rateLimit(ip: string): Promise<NextResponse | null> {
  if (!limiter) return null // Skip if Redis not configured (dev)
  const { success } = await limiter.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta más tarde.' }, { status: 429 })
  }
  return null
}
