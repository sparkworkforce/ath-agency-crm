import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UpdateClientStatusSchema } from '@/lib/validations/clients'
import { updateClientStatus } from '@/lib/services/clients.service'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const result = UpdateClientStatusSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  try {
    const client = await updateClientStatus(id, result.data.status, session.user.id)
    return NextResponse.json({ client })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
