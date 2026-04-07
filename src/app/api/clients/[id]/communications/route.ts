import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateCommunicationSchema } from '@/lib/validations/clients'
import { logCommunication, getCommunications } from '@/lib/services/clients.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const communications = await getCommunications(id)
  return NextResponse.json({ communications })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const result = CreateCommunicationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const communication = await logCommunication(id, result.data, session.user.id)
    return NextResponse.json({ communication }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
