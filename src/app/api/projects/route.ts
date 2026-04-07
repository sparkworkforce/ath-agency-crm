import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateProjectSchema } from '@/lib/validations/projects'
import { createProject, listProjectsByClient } from '@/lib/services/projects.service'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const clientId = request.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId requerido' }, { status: 400 })

  const projects = await listProjectsByClient(clientId)
  return NextResponse.json({ projects })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const result = CreateProjectSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const project = await createProject(result.data)
    return NextResponse.json({ project }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
