import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, esc } from '@/lib/email'
import { getEffectivePlan } from '@/lib/plan-gating'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  const now = new Date()

  // Auto-transition overdue invoices
  const overdueCount = await prisma.invoice.updateMany({
    where: { status: 'pendiente', dueDate: { lt: now } },
    data: { status: 'vencido' },
  })

  // Auto-transition fully paid invoices
  const paidInvoices = await prisma.invoice.findMany({
    where: { status: { in: ['pendiente', 'vencido'] } },
    select: { id: true, totalAmount: true, payments: { select: { amount: true } } },
  })
  let autoPaid = 0
  for (const inv of paidInvoices) {
    const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    if (totalPaid >= Number(inv.totalAmount)) {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'pagado' } })
      autoPaid++
    }
  }

  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Process per-agency to maintain tenant isolation
  const agencies = await prisma.agency.findMany({
    select: { id: true, name: true, logoUrl: true, primaryColor: true, plan: true, trialEndsAt: true, stripeSubId: true, notifyOverdue: true },
  })

  let sent = 0
  let total = 0
  for (const agency of agencies) {
    const effectivePlan = getEffectivePlan(agency)
    if (effectivePlan === 'FREE') continue
    if (agency.notifyOverdue === false) continue

    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'pendiente',
        client: { agencyId: agency.id, deletedAt: null },
        OR: [
          { dueDate: { gte: now, lte: threeDaysFromNow } },
          { dueDate: { gte: oneDayAgo, lt: now } },
          { dueDate: { gte: sevenDaysAgo, lt: oneDayAgo } },
        ],
      },
      include: { client: { select: { contactEmail: true, contactName: true } } },
    })

    total += invoices.length
    const agencyBranding = { name: agency.name, logoUrl: agency.logoUrl, primaryColor: agency.primaryColor }
    const safeName = agency.name.replace(/[\r\n]/g, '')

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
        message = `Tu factura por $${inv.totalAmount} lleva ${Math.abs(daysUntilDue)} días vencida. Contacta a ${safeName} para resolver.`
      }

      try {
        await sendEmail(inv.client.contactEmail, subject,
          `<p>Hola ${esc(inv.client.contactName)},</p><p>${message}</p><p style="color:#6b7280">— ${esc(agency.name)}</p>`,
          agencyBranding
        )
        sent++
      } catch { /* continue on email failure */ }
    }
  }

  return NextResponse.json({ sent, total, overdueTransitioned: overdueCount.count, autoPaid })
}
