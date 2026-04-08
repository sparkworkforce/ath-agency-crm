import { rateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendEmail, emailButton } from '@/lib/email'
import { RegisterAgencySchema } from '@/lib/validations/agency'

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request.headers.get('x-forwarded-for') ?? 'unknown')
  if (blocked) return blocked

  const body = await request.json()
  const result = RegisterAgencySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  const { agencyName, name, email, password } = result.data

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
  }

  const baseSlug = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  let slug = baseSlug
  let counter = 0
  while (await prisma.agency.findUnique({ where: { slug } })) {
    counter++
    slug = `${baseSlug}-${counter}`
  }

  try {
    const hashed = await bcrypt.hash(password, 12)

    const agency = await prisma.$transaction(async (tx) => {
      const ag = await tx.agency.create({ data: { name: agencyName, slug, plan: 'FREE' } })
      const user = await tx.user.create({ data: { name, email, password: hashed, role: 'AGENCY', agencyId: ag.id, active: true } })

      // Seed demo data
      const demoClient = await tx.client.create({
        data: {
          businessName: 'Tienda Demo',
          contactName: 'María García',
          contactEmail: 'demo@ejemplo.com',
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

    return NextResponse.json({ agency: { id: agency.id, slug: agency.slug } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
