import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { requireRoutePermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { CreateQuoteSchema } from '@/lib/validations/quotes'
import { safeParseBody } from '@/lib/safe-parse-body'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const quotes = await prisma.quote.findMany({
    where: { client: { agencyId: session.user.agencyId } },
    include: { client: { select: { businessName: true } }, lines: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ quotes })
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const permError = requireRoutePermission(session.user.agencyRole, 'quotes')
  if (permError) return permError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = CreateQuoteSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  const { clientId, title, description, lines, validUntil } = result.data

  const client = await prisma.client.findFirst({ where: { id: clientId, agencyId: session.user.agencyId } })
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0)

  const quote = await prisma.quote.create({
    data: {
      clientId, title, description, totalAmount, createdBy: session.user.id,
      validUntil: validUntil ? new Date(validUntil) : null,
      lines: { create: lines.map((l, i) => ({ description: l.description, amount: l.amount, order: i })) },
    },
    include: { lines: true },
  })

  return NextResponse.json({ quote }, { status: 201 })
}
