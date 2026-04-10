import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateTicketSchema } from '@/lib/validations/projects'
import { createSupportTicket } from '@/lib/services/projects.service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ReplySchema = z.object({ ticketId: z.string(), body: z.string().min(1).max(5000) })

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!session.user.clientId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { clientId: session.user.clientId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ tickets })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!session.user.clientId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const body = await request.json()

  // Reply to existing ticket
  const reply = ReplySchema.safeParse(body)
  if (reply.success) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: reply.data.ticketId, clientId: session.user.clientId },
    })
    if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: reply.data.ticketId,
        senderId: session.user.id,
        role: session.user.role,
        body: reply.data.body,
      },
    })
    return NextResponse.json({ message }, { status: 201 })
  }

  // Create new ticket
  const result = CreateTicketSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const ticket = await createSupportTicket(session.user.clientId, result.data)
    return NextResponse.json({ ticket }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
