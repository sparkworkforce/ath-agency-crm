import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { uploadFile } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { validateUpload } from '@/lib/upload-validation'

const LOGO_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const LOGO_MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  const uploadError = await validateUpload(file, { maxSizeBytes: LOGO_MAX_SIZE, allowedTypes: LOGO_ALLOWED_TYPES })
  if (uploadError) return uploadError

  const buffer = Buffer.from(await file!.arrayBuffer())
  const ALLOWED_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif']
  const ext = file!.name.split('.').pop()?.toLowerCase() ?? 'png'
  if (!ALLOWED_EXTS.includes(ext)) return NextResponse.json({ error: 'Extension not allowed' }, { status: 400 })
  const path = `logos/${session.user.agencyId}.${ext}`

  await uploadFile('project-files', path, buffer, file!.type, true)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const logoUrl = `${supabaseUrl}/storage/v1/object/public/project-files/${path}`

  const agency = await prisma.agency.update({
    where: { id: session.user.agencyId },
    data: { logoUrl },
  })

  return NextResponse.json({ logoUrl: agency.logoUrl })
}
