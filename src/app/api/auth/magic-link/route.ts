import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateMagicLinkToken, invalidateMagicLinkToken } from '@/lib/services/auth.service'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url))
  }

  const result = await validateMagicLinkToken(token)

  if (!result.valid) {
    return NextResponse.redirect(new URL(`/login?error=${result.reason}`, request.url))
  }

  const user = await prisma.user.findUnique({ where: { id: result.userId } })

  if (!user || !user.active) {
    return NextResponse.redirect(new URL('/login?error=inactive', request.url))
  }

  // Invalidate the token (single-use)
  await invalidateMagicLinkToken(token)

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

  const response = NextResponse.redirect(new URL('/portal', request.url))
  response.cookies.set('next-auth.session-token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + maxAge * 1000),
    path: '/',
  })

  return response
}
