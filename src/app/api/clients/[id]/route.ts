import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { UpdateClientSchema } from '@/lib/validations/clients'
import { getClientById, updateClient, softDeleteClient } from '@/lib/services/clients.service'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const client = await getClientById(id, session.user.agencyId)
  if (!client) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ client })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const body = await request.json()
  const { tags, ...rest } = body
  const result = UpdateClientSchema.safeParse(rest)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    let client
    if (tags && Array.isArray(tags)) {
      client = await prisma.client.update({
        where: { id, agencyId: session.user.agencyId, deletedAt: null },
        data: {
          ...result.data,
          tags: {
            set: [],
            connectOrCreate: tags.map((name: string) => ({
              where: { agencyId_name: { agencyId: session.user.agencyId, name } },
              create: { name, agencyId: session.user.agencyId },
            })),
          },
        },
        include: { tags: true },
      })
    } else {
      client = await updateClient(id, result.data, session.user.agencyId)
    }
    return NextResponse.json({ client })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  try {
    await softDeleteClient(id, session.user.agencyId)
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Error && e.message === 'CLIENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
