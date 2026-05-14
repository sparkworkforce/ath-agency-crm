import { rateLimitAuth as rateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailButton } from '@/lib/email'
import { invalidateUserSessions } from '@/lib/session-rotation'
import { safeParseBody } from '@/lib/safe-parse-body'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [body, parseError] = await safeParseBody<Record<string, unknown>>(request)
  if (parseError) return parseError
  const email = typeof body?.email === 'string' ? body.email.trim() : null
  const token = typeof body?.token === 'string' ? body.token : null
  const password = typeof body?.password === 'string' ? body.password : null

  // Request reset (send email)
  if (email && !token) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.role !== 'AGENCY') return NextResponse.json({ ok: true }) // Don't leak

    const resetToken = crypto.randomUUID()
    const hashedToken = hashToken(resetToken)
    // Invalidate any existing reset tokens for this email
    await prisma.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } })
    await prisma.verificationToken.create({
      data: { identifier: `reset:${email}`, token: hashedToken, expires: new Date(Date.now() + 60 * 60 * 1000) },
    })

    const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    await sendEmail(email, 'Restablecer contraseña — CobraHub',
      `<p>Haz clic para restablecer tu contraseña:</p><p>${emailButton(url, 'Restablecer contraseña')}</p><p style="font-size:12px;color:#6b7280">Este enlace expira en 1 hora.</p>`
    ).catch(() => {})

    return NextResponse.json({ ok: true })
  }

  // Reset password (with token)
  if (token && password) {
    if (password.length < 8) return NextResponse.json({ error: 'Contraseña muy corta' }, { status: 400 })
    const WEAK_PASSWORDS = ['12345678','password','qwerty123','abcdefgh','11111111','123456789','password1','iloveyou','admin123','welcome1']
    if (WEAK_PASSWORDS.includes(password.toLowerCase())) return NextResponse.json({ error: 'Contraseña muy común' }, { status: 400 })

    const tokenHash = hashToken(token)
    const record = await prisma.verificationToken.findUnique({ where: { token: tokenHash } })
    if (!record || !record.identifier.startsWith('reset:') || record.expires < new Date()) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    }

    const email = record.identifier.replace('reset:', '')
    const hashed = await bcrypt.hash(password, 12)
    const updated = await prisma.user.updateMany({ where: { email }, data: { password: hashed } })
    await prisma.verificationToken.delete({ where: { token: tokenHash } })

    // Invalidate all sessions for this user
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (user) await invalidateUserSessions(user.id)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
}
