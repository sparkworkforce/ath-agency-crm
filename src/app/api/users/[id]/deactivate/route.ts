import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { deactivateUser } from '@/lib/services/users.service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  if (id === session.user.id) {
    return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 })
  }
  try {
    await deactivateUser(id, session.user.agencyId)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
