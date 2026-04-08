import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { getProjectById } from '@/lib/services/projects.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const project = await getProjectById(id, session.user.agencyId)
  if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ project })
}
