import { rateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailButton } from '@/lib/email'
import { RegisterAgencySchema } from '@/lib/validations/agency'
import { safeParseBody } from '@/lib/safe-parse-body'
import { isBreachedPassword } from '@/lib/password-check'

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = RegisterAgencySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  const { agencyName, name, email, password } = result.data

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ agency: { id: 'ok', slug: 'ok' } }, { status: 201 })
  }

  const baseSlug = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  let slug = baseSlug
  let counter = 0
  while (await prisma.agency.findUnique({ where: { slug } })) {
    counter++
    slug = `${baseSlug}-${counter}`
  }

  if (isBreachedPassword(password)) {
    return NextResponse.json({ error: 'Contraseña muy común o comprometida. Elige otra.' }, { status: 400 })
  }

  try {
    const hashed = await bcrypt.hash(password, 12)

    const agency = await prisma.$transaction(async (tx) => {
      const ag = await tx.agency.create({ data: { name: agencyName, slug, plan: 'PROFESSIONAL', trialEndsAt: new Date(Date.now() + 14 * 86400000) } })
      const user = await tx.user.create({ data: { name, email, password: hashed, role: 'AGENCY', agencyId: ag.id, active: true } })

      // Seed demo data
      const demoClient = await tx.client.create({
        data: {
          businessName: 'Tienda Demo',
          contactName: 'María García',
          contactEmail: `demo+${slug}@ejemplo.com`,
          contactPhone: '787-555-0100',
          platform: 'WOOCOMMERCE',
          status: 'en_progreso',
          agencyId: ag.id,
        },
      })

      const demoProject = await tx.project.create({
        data: {
          name: 'Integración ATH Business — Tienda Demo',
          clientId: demoClient.id,
          completionPercentage: 60,
        },
      })

      const tasks: { title: string; status: 'completado' | 'en_progreso' | 'pendiente'; order: number }[] = [
        { title: 'Crear cuenta ATH Business', status: 'completado', order: 1 },
        { title: 'Configurar API keys', status: 'completado', order: 2 },
        { title: 'Integrar Payment Button', status: 'completado', order: 3 },
        { title: 'Configurar webhooks', status: 'en_progreso', order: 4 },
        { title: 'Pruebas en sandbox', status: 'pendiente', order: 5 },
      ]
      await tx.task.createMany({ data: tasks.map(t => ({ ...t, projectId: demoProject.id })) })

      await tx.invoice.create({
        data: {
          clientId: demoClient.id,
          totalAmount: 1500,
          status: 'pagado',
          dueDate: new Date(),
          createdBy: user.id,
          lineItems: { create: [{ description: 'Integración ATH Business — Setup', amount: 1500 }] },
        },
      })

      // Integration status so Go-Live Score is visible
      await tx.integrationStatus.create({ data: { projectId: demoProject.id, accountStatus: 'approved', environment: 'sandbox', webhookUrl: 'https://tienda-demo.com/webhook/ath', webhookVerified: true, testTransactionOk: false } })

      // Sample communications
      await tx.communication.createMany({ data: [
        { clientId: demoClient.id, channel: 'Email', summary: 'Enviado credenciales de sandbox ATH Business', date: new Date(), createdBy: user.id },
        { clientId: demoClient.id, channel: 'WhatsApp', summary: 'Cliente confirmó recepción de API keys', date: new Date(), createdBy: user.id },
      ] })

      // Sample code snippets
      await tx.codeSnippet.createMany({ data: [
        { agencyId: ag.id, authorId: user.id, title: 'ATH Business — Botón de pago', language: 'html', platform: 'WOOCOMMERCE', category: 'wrapper', description: 'Botón básico de pago', code: '<form action="/api/ath/checkout" method="POST">\n  <input type="hidden" name="amount" value="25.00" />\n  <button type="submit">Pagar con ATH</button>\n</form>' },
        { agencyId: ag.id, authorId: user.id, title: 'Webhook verification', language: 'javascript', platform: 'GENERAL', category: 'webhook', description: 'Verificar firma HMAC', code: 'const crypto = require("crypto");\nfunction verifyWebhook(body, sig, secret) {\n  return crypto.createHmac("sha256", secret).update(body).digest("hex") === sig;\n}' },
      ] })

      return ag
    })

    // Send verification email
    const token = crypto.randomUUID()
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    })
    const url = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`
    await sendEmail(email, 'Verifica tu correo — Bienvenido a CobraHub',
      `<p>Hola ${name},</p><p>Tu agencia <strong>${agencyName}</strong> ha sido creada. Verifica tu correo para comenzar:</p><p>${emailButton(url, 'Verificar email')}</p>`
    ).catch(() => {}) // Don't fail registration if email fails

    // Handle referral code
    const referralCode = (body as Record<string, unknown>).referralCode as string | undefined
    if (referralCode) {
      const ref = await prisma.referral.findFirst({ where: { code: referralCode, referredAgencyId: null } })
      if (ref) {
        await prisma.referral.update({ where: { id: ref.id }, data: { referredAgencyId: agency.id, redeemedAt: new Date(), rewardApplied: true } })
        // Create a fresh code for the referrer's next referral
        const newCode = `cbh-${crypto.randomUUID().slice(0, 8)}`
        await prisma.referral.create({ data: { referrerAgencyId: ref.referrerAgencyId, code: newCode } })
      }
    }

    return NextResponse.json({ agency: { id: agency.id, slug: agency.slug } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
