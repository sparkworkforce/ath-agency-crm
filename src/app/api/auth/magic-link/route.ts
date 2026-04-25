import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { consumeMagicLinkToken } from '@/lib/services/auth.service'
import { rateLimitAuth } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const blocked = await rateLimitAuth(request)
  if (blocked) return blocked

  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url))
  }

  const result = await consumeMagicLinkToken(token)

  if (!result.valid) {
    return NextResponse.redirect(new URL(`/login?error=${result.reason}`, request.url))
  }

  const user = await prisma.user.findUnique({ where: { id: result.userId } })

  if (!user || !user.active) {
    return NextResponse.redirect(new URL('/login?error=inactive', request.url))
  }

  // Create session directly for magic link users (CLIENT role, 1h expiry)
  const sessionToken = crypto.randomUUID()
  const maxAge = 60 * 60 // 1 hour for CLIENT users
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + maxAge * 1000),
    },
  })

  const isProd = process.env.NODE_ENV === 'production'
  const cookieName = isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token'

  const response = NextResponse.redirect(new URL('/portal', request.url))
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    expires: new Date(Date.now() + maxAge * 1000),
    path: '/',
  })

  return response
}
