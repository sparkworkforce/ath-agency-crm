import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UpdateClientSchema } from '@/lib/validations/clients'
import { getClientById, updateClient, softDeleteClient } from '@/lib/services/clients.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const client = await getClientById(id)
  if (!client) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ client })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const result = UpdateClientSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const client = await updateClient(id, result.data)
    return NextResponse.json({ client })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  try {
    await softDeleteClient(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
