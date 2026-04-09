import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — quote detail (agency owner or portal client)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const clientFilter = session.user.role === 'CLIENT'
    ? { users: { some: { id: session.user.id } } }
    : { agencyId: session.user.agencyId! }

  const quote = await prisma.quote.findFirst({
    where: { id, client: clientFilter },
    include: { client: { select: { id: true, businessName: true, agencyId: true } }, lines: { orderBy: { order: 'asc' } } },
  })
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ quote })
}

// PATCH — approve (portal client) or convert to invoice (agency)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  // Portal approval — verify client owns this quote
  if (body.action === 'approve') {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const quote = await prisma.quote.findFirst({
      where: { id, status: 'enviado', client: { users: { some: { id: session.user.id } } } },
    })
    if (!quote) return NextResponse.json({ error: 'Cotización no disponible' }, { status: 400 })

    const updated = await prisma.quote.update({ where: { id }, data: { status: 'aprobado', approvedAt: new Date() } })
    return NextResponse.json({ quote: updated })
  }

  // Convert to invoice — verify agency owns this quote
  if (body.action === 'convert') {
    const [session, authError] = await requireAgencyAuth()
    if (authError) return authError

    const quote = await prisma.quote.findFirst({
      where: { id, status: 'aprobado', client: { agencyId: session.user.agencyId } },
      include: { lines: true },
    })
    if (!quote) return NextResponse.json({ error: 'Solo cotizaciones aprobadas' }, { status: 400 })

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          clientId: quote.clientId, totalAmount: quote.totalAmount, status: 'pendiente',
          dueDate: new Date(Date.now() + 30 * 86400000), createdBy: session.user.id,
          lineItems: { create: quote.lines.map(l => ({ description: l.description, amount: l.amount, order: l.order })) },
        },
      })
      await tx.quote.update({ where: { id }, data: { status: 'convertido' } })
      return inv
    })

    return NextResponse.json({ invoice })
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
