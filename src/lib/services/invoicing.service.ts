import { prisma } from '../prisma'
import { sendEmail, esc } from '../email'
import type { CreateInvoiceInput, RecordPaymentInput } from '../validations/invoices'
import { paginationArgs, paginated, type PaginationInput, type PaginatedResult } from '../pagination'

export async function createInvoice(data: CreateInvoiceInput, createdBy: string, agencyId: string) {
  // Verify client belongs to this agency
  const client = await prisma.client.findFirst({ where: { id: data.clientId, agencyId, deletedAt: null } })
  if (!client) throw new Error('CLIENT_NOT_FOUND')

  const invoice = await prisma.invoice.create({
    data: {
      clientId: data.clientId,
      totalAmount: data.totalAmount,
      dueDate: new Date(data.dueDate),
      isRetainer: data.isRetainer,
      status: 'pendiente',
      createdBy,
      lineItems: {
        create: data.lineItems.map((item, i) => ({
          description: item.description,
          amount: item.amount,
          order: i,
        })),
      },
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

export async function getInvoiceById(invoiceId: string, agencyId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, client: { agencyId } },
    include: {
      payments: { orderBy: { receivedAt: 'desc' } },
      lineItems: { orderBy: { order: 'asc' } },
      client: { select: { id: true, businessName: true, contactEmail: true, contactName: true, contactPhone: true } },
      auditLog: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function listAllInvoices(agencyId: string, pagination?: undefined): Promise<any[]>
export async function listAllInvoices(agencyId: string, pagination: PaginationInput): Promise<PaginatedResult<any>>
export async function listAllInvoices(agencyId: string, pagination?: PaginationInput) {
  const where = { client: { agencyId, deletedAt: null } }
  const include = { client: { select: { id: true, businessName: true } }, payments: { select: { amount: true } } }

  if (!pagination) {
    return prisma.invoice.findMany({ where, include, orderBy: { createdAt: 'desc' } })
  }

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({ where, include, orderBy: { createdAt: 'desc' }, ...paginationArgs(pagination) }),
    prisma.invoice.count({ where }),
  ])
  return paginated(data, total, pagination)
}

export async function listInvoicesByClient(clientId: string, agencyId: string) {
  return prisma.invoice.findMany({
    where: { clientId, client: { agencyId } },
    include: { payments: { select: { amount: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function recordPayment(
  invoiceId: string,
  data: RecordPaymentInput,
  recordedBy: string,
  agencyId: string
) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, client: { agencyId } },
      include: { payments: { select: { amount: true } } },
    })
    if (!invoice) throw new Error('INVOICE_NOT_FOUND')

    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        receivedAt: new Date(data.receivedAt),
        method: data.method,
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
          agency: {
            include: {
              users: {
                where: { role: 'AGENCY', active: true },
                take: 1,
              },
            },
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
    const agencyUser = (invoice.client as any).agency?.users?.[0]
    if (!agencyUser?.email) continue

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    await sendEmail(agencyUser.email, `⚠️ Retainer Vencido — ${invoice.client.businessName}`,
      `<p>El retainer del cliente <strong>${esc(invoice.client.businessName)}</strong> está vencido.</p><p><strong>Factura:</strong> ${invoice.id}</p><p><strong>Fecha límite:</strong> ${invoice.dueDate.toLocaleDateString('es-PR')}</p><p><strong>Monto:</strong> $${invoice.totalAmount}</p>`
    ).catch(() => {
      console.error(`Failed to send retainer alert for invoice ${invoice.id}`)
    })
  }
}

export async function getCurrentMonthRevenue(agencyId: string): Promise<number> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const result = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { receivedAt: { gte: start, lte: end }, invoice: { client: { agencyId } } },
  })

  return Number(result._sum.amount ?? 0)
}

export async function getMonthlyRevenueChart(agencyId: string, months = 6): Promise<{ month: string; revenue: number }[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

  const payments = await prisma.payment.findMany({
    where: { receivedAt: { gte: start }, invoice: { client: { agencyId } } },
    select: { amount: true, receivedAt: true },
  })

  const buckets = new Map<string, number>()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0)
  }

  for (const p of payments) {
    const d = new Date(p.receivedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + Number(p.amount))
  }

  return Array.from(buckets.entries()).map(([key, revenue]) => {
    const [y, m] = key.split('-').map(Number)
    const d = new Date(y, m, 1)
    return { month: d.toLocaleDateString('es-PR', { month: 'short', year: '2-digit' }), revenue }
  })
}
