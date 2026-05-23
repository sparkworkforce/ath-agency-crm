import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/validations/projects'
import { uploadProjectFile } from '@/lib/services/projects.service'
import { validateUpload, sanitizeFilename } from '@/lib/upload-validation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  const uploadError = await validateUpload(file, { maxSizeBytes: MAX_FILE_SIZE_BYTES, allowedTypes: ALLOWED_FILE_TYPES })
  if (uploadError) return uploadError

  try {
    const buffer = Buffer.from(await file!.arrayBuffer())
    const projectFile = await uploadProjectFile(id, sanitizeFilename(file!.name), file!.type, file!.size, buffer, session.user.id, session.user.agencyId)
    return NextResponse.json({ file: projectFile }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
