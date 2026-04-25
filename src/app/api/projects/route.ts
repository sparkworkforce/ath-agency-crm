import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { CreateProjectSchema } from '@/lib/validations/projects'
import { PaginationSchema } from '@/lib/pagination'
import { createProject, listProjectsByClient, listAllProjects } from '@/lib/services/projects.service'
import { safeParseBody } from '@/lib/safe-parse-body'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const sp = request.nextUrl.searchParams
  const clientId = sp.get('clientId')
  const pageParam = sp.get('page')

  if (clientId) {
    const projects = await listProjectsByClient(clientId, session.user.agencyId)
    return NextResponse.json({ projects })
  }

  if (pageParam) {
    const pagination = PaginationSchema.parse({ page: sp.get('page'), limit: sp.get('limit') })
    const result = await listAllProjects(session.user.agencyId, pagination)
    return NextResponse.json(result)
  }

  const projects = await listAllProjects(session.user.agencyId)
  return NextResponse.json({ projects })
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = CreateProjectSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const project = await createProject(result.data, session.user.agencyId)
    return NextResponse.json({ project }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
