import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { CreateCommunicationSchema } from '@/lib/validations/clients'
import { logCommunication, getCommunications } from '@/lib/services/clients.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const communications = await getCommunications(id, session.user.agencyId)
  return NextResponse.json({ communications })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const body = await request.json()
  const result = CreateCommunicationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const communication = await logCommunication(id, result.data, session.user.id, session.user.agencyId)
    return NextResponse.json({ communication }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
