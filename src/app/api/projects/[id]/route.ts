import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getProjectById } from '@/lib/services/projects.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const project = await getProjectById(id)
  if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ project })
}
