import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

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

  const { clientId, title, description, lines, validUntil } = await request.json()
  if (!clientId || !title || !lines?.length) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const client = await prisma.client.findFirst({ where: { id: clientId, agencyId: session.user.agencyId } })
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const totalAmount = lines.reduce((sum: number, l: { amount: number }) => sum + l.amount, 0)

  const quote = await prisma.quote.create({
    data: {
      clientId, title, description, totalAmount, createdBy: session.user.id,
      validUntil: validUntil ? new Date(validUntil) : null,
      lines: { create: lines.map((l: { description: string; amount: number }, i: number) => ({ description: l.description, amount: l.amount, order: i })) },
    },
    include: { lines: true },
  })

  return NextResponse.json({ quote }, { status: 201 })
}
