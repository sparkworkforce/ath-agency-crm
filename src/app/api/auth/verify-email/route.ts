import { rateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailButton } from '@/lib/email'

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request.headers.get('x-forwarded-for') ?? 'unknown')
  if (blocked) return blocked

  const body = await request.json()
  const email = typeof body?.email === 'string' ? body.email.trim() : null
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.emailVerified) return NextResponse.json({ ok: true }) // Don't leak existence

  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })

  const url = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`
  await sendEmail(email, 'Verifica tu correo — CobraHub',
    `<p>Haz clic para verificar tu correo:</p><p>${emailButton(url, 'Verificar email')}</p><p style="font-size:12px;color:#6b7280">Este enlace expira en 24 horas.</p>`
  )

  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/login?error=invalid', request.url))

  const record = await prisma.verificationToken.findUnique({ where: { token } })
  if (!record || record.expires < new Date()) {
    return NextResponse.redirect(new URL('/login?error=expired', request.url))
  }

  await prisma.user.updateMany({ where: { email: record.identifier }, data: { emailVerified: new Date() } })
  await prisma.verificationToken.delete({ where: { token } })

  return NextResponse.redirect(new URL('/login?verified=true', request.url))
}
