import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateClientSchema } from '@/lib/validations/clients'
import { createClient, searchClients } from '@/lib/services/clients.service'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q') ?? undefined

  try {
    const clients = await searchClients(q)
    return NextResponse.json({ clients })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const result = CreateClientSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  try {
    const client = await createClient(result.data, session.user.id)
    return NextResponse.json({ client }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
