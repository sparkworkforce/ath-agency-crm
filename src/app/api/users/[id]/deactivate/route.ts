import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { deactivateUser } from '@/lib/services/users.service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  try {
    await deactivateUser(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
