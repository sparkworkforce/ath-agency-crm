import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/validations/projects'
import { uploadProjectFile } from '@/lib/services/projects.service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo PDF, PNG, JPG, ZIP.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'El archivo excede el límite de 10MB.' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const projectFile = await uploadProjectFile(id, file.name, file.type, file.size, buffer, session.user.id, session.user.agencyId)
    return NextResponse.json({ file: projectFile }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
