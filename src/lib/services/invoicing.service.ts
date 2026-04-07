import { prisma } from '../prisma'
import { resend } from '../resend'
import type { CreateInvoiceInput, RecordPaymentInput } from '../validations/invoices'

export async function createInvoice(data: CreateInvoiceInput, createdBy: string) {
  const invoice = await prisma.invoice.create({
    data: {
      clientId: data.clientId,
      totalAmount: data.totalAmount,
      dueDate: new Date(data.dueDate),
      isRetainer: data.isRetainer,
      status: 'pendiente',
      createdBy,
    },
  })

  await prisma.invoiceAuditLog.create({
    data: {
      invoiceId: invoice.id,
      action: 'CREATED',
      actorId: createdBy,
      afterData: { status: 'pendiente', totalAmount: data.totalAmount },
    },
  })

  return invoice
}

export async function getInvoiceById(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: { orderBy: { receivedAt: 'desc' } },
      client: { select: { id: true, businessName: true, contactEmail: true } },
      auditLog: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function listInvoicesByClient(clientId: string) {
  return prisma.invoice.findMany({
    where: { clientId },
    include: { payments: { select: { amount: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function recordPayment(
  invoiceId: string,
  data: RecordPaymentInput,
  recordedBy: string
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: { select: { amount: true } } },
    })
    if (!invoice) throw new Error('INVOICE_NOT_FOUND')

    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        receivedAt: new Date(data.receivedAt),
        recordedBy,
      },
    })

    // Calculate total paid
    const previousTotal = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )
    const newTotal = previousTotal + data.amount
    const invoiceTotal = Number(invoice.totalAmount)

    const newStatus = newTotal >= invoiceTotal ? 'pagado' : invoice.status

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus },
    })

    await tx.invoiceAuditLog.create({
      data: {
        invoiceId,
        paymentId: payment.id,
        action: 'PAYMENT_RECORDED',
        actorId: recordedBy,
        beforeData: { status: invoice.status, totalPaid: previousTotal },
        afterData: { status: newStatus, totalPaid: newTotal },
      },
    })

    return { payment, invoice: updatedInvoice }
  })
}

export async function checkAndUpdateOverdueInvoices(): Promise<void> {
  const now = new Date()

  // Find invoices that are about to transition to vencido (still pendiente, past due)
  const newlyOverdue = await prisma.invoice.findMany({
    where: {
      status: 'pendiente',
      dueDate: { lt: now },
      isRetainer: true,
    },
    include: {
      client: {
        include: {
          users: {
            where: { role: 'AGENCY', active: true },
            take: 1,
          },
        },
      },
    },
  })

  // Update all overdue pendiente invoices to vencido
  await prisma.invoice.updateMany({
    where: {
      status: 'pendiente',
      dueDate: { lt: now },
    },
    data: { status: 'vencido' },
  })

  // Send alerts only for retainers that just became vencido (not previously alerted)
  for (const invoice of newlyOverdue) {
    const agencyUser = invoice.client.users[0]
    if (!agencyUser?.email) continue

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: agencyUser.email,
      subject: `⚠️ Retainer Vencido — ${invoice.client.businessName}`,
      html: `
        <p>El retainer del cliente <strong>${invoice.client.businessName}</strong> está vencido.</p>
        <ul>
          <li><strong>Factura:</strong> ${invoice.id}</li>
          <li><strong>Fecha límite:</strong> ${invoice.dueDate.toLocaleDateString('es-PR')}</li>
          <li><strong>Monto:</strong> $${Number(invoice.totalAmount).toFixed(2)}</li>
        </ul>
        <p><a href="${baseUrl}/invoices/${invoice.id}">Ver factura</a></p>
      `,
    }).catch(() => {
      console.error(`Failed to send retainer alert for invoice ${invoice.id}`)
    })
  }
}

export async function getCurrentMonthRevenue(): Promise<number> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const result = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { receivedAt: { gte: start, lte: end } },
  })

  return Number(result._sum.amount ?? 0)
}

export async function getMonthlyRevenueChart(months = 6): Promise<{ month: string; revenue: number }[]> {
  const now = new Date()
  const result: { month: string; revenue: number }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    const agg = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { receivedAt: { gte: start, lte: end } },
    })

    result.push({
      month: date.toLocaleDateString('es-PR', { month: 'short', year: '2-digit' }),
      revenue: Number(agg._sum.amount ?? 0),
    })
  }

  return result
}
