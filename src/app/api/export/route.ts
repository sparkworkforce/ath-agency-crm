import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { toCsv, csvResponse } from '@/lib/csv'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const agencyId = session.user.agencyId
  const type = request.nextUrl.searchParams.get('type')

  // CSV export requires Professional+ plan
  const agency = await prisma.agency.findUnique({ where: { id: agencyId }, select: { plan: true } })
  if (agency?.plan === 'FREE') {
    return NextResponse.json({ error: 'Exportar CSV requiere plan Profesional o superior.' }, { status: 403 })
  }

  if (type === 'clients') {
    const clients = await prisma.client.findMany({
      where: { agencyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    const csv = toCsv(
      ['Negocio', 'Contacto', 'Email', 'Teléfono', 'Industria', 'Plataforma', 'Estado', 'Creado'],
      clients.map((c) => [
        c.businessName, c.contactName, c.contactEmail,
        c.contactPhone ?? '', c.industry ?? '', c.platform,
        c.status, c.createdAt.toISOString().slice(0, 10),
      ])
    )
    return csvResponse(csv, `clientes-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (type === 'invoices') {
    const invoices = await prisma.invoice.findMany({
      where: { client: { agencyId, deletedAt: null } },
      include: { client: { select: { businessName: true } }, payments: { select: { amount: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const csv = toCsv(
      ['ID', 'Cliente', 'Monto', 'Pagado', 'Estado', 'Vence', 'Retainer', 'Creado'],
      invoices.map((inv) => {
        const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0)
        return [
          inv.id.slice(-8).toUpperCase(), inv.client.businessName,
          Number(inv.totalAmount).toFixed(2), paid.toFixed(2),
          inv.status, inv.dueDate.toISOString().slice(0, 10),
          inv.isRetainer ? 'Sí' : 'No', inv.createdAt.toISOString().slice(0, 10),
        ]
      })
    )
    return csvResponse(csv, `facturas-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (type === 'revenue') {
    const payments = await prisma.payment.findMany({
      where: { invoice: { client: { agencyId } } },
      include: { invoice: { include: { client: { select: { businessName: true } } } } },
      orderBy: { receivedAt: 'desc' },
    })
    const csv = toCsv(
      ['Fecha', 'Monto', 'Cliente', 'Factura'],
      payments.map((p) => [
        p.receivedAt.toISOString().slice(0, 10),
        Number(p.amount).toFixed(2),
        p.invoice.client.businessName,
        p.invoiceId.slice(-8).toUpperCase(),
      ])
    )
    return csvResponse(csv, `revenue-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return new Response('Invalid type. Use ?type=clients|invoices|revenue', { status: 400 })
}
