import { handlers } from '@/lib/auth'
import { rateLimitAuth } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

export const GET = handlers.GET

export async function POST(request: NextRequest) {
  const blocked = await rateLimitAuth(request)
  if (blocked) return blocked
  return handlers.POST(request)
}
