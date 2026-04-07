import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateTicketSchema } from '@/lib/validations/projects'
import { createSupportTicket, listSupportTickets } from '@/lib/services/projects.service'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!session.user.clientId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const tickets = await listSupportTickets(session.user.clientId)
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
