import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/validations/projects'
import { uploadClientFile } from '@/lib/services/projects.service'
import { validateUpload } from '@/lib/upload-validation'

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!session.user.clientId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  const uploadError = await validateUpload(file, { maxSizeBytes: MAX_FILE_SIZE_BYTES, allowedTypes: ALLOWED_FILE_TYPES })
  if (uploadError) return uploadError

  try {
    const buffer = Buffer.from(await file!.arrayBuffer())
    const result = await uploadClientFile(
      session.user.clientId,
      file!.name,
      file!.type,
      file!.size,
      buffer
    )
    return NextResponse.json({ file: result }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
