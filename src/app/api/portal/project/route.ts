import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getClientActiveProject } from '@/lib/services/projects.service'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!session.user.clientId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  try {
    const project = await getClientActiveProject(session.user.clientId)
    return NextResponse.json({ project })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
