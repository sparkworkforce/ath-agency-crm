import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { toCsv, csvResponse } from '@/lib/csv'
import { getEffectivePlan } from '@/lib/plan-gating'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const agencyId = session.user.agencyId
  const type = request.nextUrl.searchParams.get('type')
  const from = request.nextUrl.searchParams.get('from')
  const to = request.nextUrl.searchParams.get('to')

  // CSV export requires Professional+ plan
  const agency = await prisma.agency.findUnique({ where: { id: agencyId }, select: { plan: true, trialEndsAt: true } })
  if (!agency || getEffectivePlan(agency) === 'FREE') {
    return NextResponse.json({ error: 'Exportar CSV requiere plan Profesional o superior.' }, { status: 403 })
  }

  const dateFilter = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  }
  const hasDateFilter = from || to

  if (type === 'clients') {
    const clients = await prisma.client.findMany({
      where: { agencyId, deletedAt: null, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
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
      where: { client: { agencyId, deletedAt: null }, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
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
      where: { invoice: { client: { agencyId } }, ...(hasDateFilter ? { receivedAt: dateFilter } : {}) },
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

  if (type === 'projects') {
    const projects = await prisma.project.findMany({
      where: { client: { agencyId, deletedAt: null }, ...(hasDateFilter ? { createdAt: dateFilter } : {}) },
      include: { client: { select: { businessName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    const csv = toCsv(
      ['Nombre', 'Cliente', 'Progreso %', 'Creado'],
      projects.map((p) => [
        p.name, p.client.businessName,
        p.completionPercentage.toFixed(0),
        p.createdAt.toISOString().slice(0, 10),
      ])
    )
    return csvResponse(csv, `proyectos-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  if (type === 'time') {
    const entries = await prisma.timeEntry.findMany({
      where: { task: { project: { client: { agencyId } } }, ...(hasDateFilter ? { startedAt: dateFilter } : {}) },
      include: { task: { select: { title: true } } },
      orderBy: { startedAt: 'desc' },
    })
    const csv = toCsv(
      ['Tarea', 'Minutos', 'Nota', 'Inicio'],
      entries.map((e) => [
        e.task.title,
        String(e.minutes ?? 0),
        e.note ?? '',
        e.startedAt.toISOString().slice(0, 16),
      ])
    )
    return csvResponse(csv, `tiempo-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return new Response('Invalid type. Use ?type=clients|invoices|revenue|projects|time', { status: 400 })
}
