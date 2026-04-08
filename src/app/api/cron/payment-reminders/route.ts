import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, esc } from '@/lib/email'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'pendiente',
      client: { deletedAt: null },
      OR: [
        { dueDate: { gte: now, lte: threeDaysFromNow } },
        { dueDate: { gte: oneDayAgo, lt: now } },
        { dueDate: { gte: sevenDaysAgo, lt: oneDayAgo } },
      ],
    },
    include: { client: { include: { agency: true } } },
  })

  let sent = 0
  for (const inv of invoices) {
    const daysUntilDue = Math.ceil((inv.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    let subject: string
    let message: string

    if (daysUntilDue > 0) {
      subject = `Recordatorio: Factura vence en ${daysUntilDue} días`
      message = `Tu factura por $${inv.totalAmount} vence el ${inv.dueDate.toLocaleDateString('es-PR')}. Por favor realiza el pago a tiempo.`
    } else if (daysUntilDue === 0) {
      subject = 'Recordatorio: Factura vence hoy'
      message = `Tu factura por $${inv.totalAmount} vence hoy. Por favor realiza el pago.`
    } else if (daysUntilDue >= -1) {
      subject = 'Factura vencida — Pago pendiente'
      message = `Tu factura por $${inv.totalAmount} venció ayer. Por favor realiza el pago lo antes posible.`
    } else {
      subject = 'Aviso final — Factura vencida hace 7 días'
      message = `Tu factura por $${inv.totalAmount} lleva ${Math.abs(daysUntilDue)} días vencida. Contacta a ${inv.client.agency.name} para resolver.`
    }

    try {
      await sendEmail(inv.client.contactEmail, subject,
        `<p>Hola ${esc(inv.client.contactName)},</p><p>${message}</p><p style="color:#6b7280">— ${esc(inv.client.agency.name)}</p>`
      )
      sent++
    } catch { /* continue on email failure */ }
  }

  return NextResponse.json({ sent, total: invoices.length })
}
