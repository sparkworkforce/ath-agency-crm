import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/validations/projects'
import { uploadClientFile } from '@/lib/services/projects.service'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!session.user.clientId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

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
    const result = await uploadClientFile(
      session.user.clientId,
      file.name,
      file.type,
      file.size,
      buffer
    )
    return NextResponse.json({ file: result }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
