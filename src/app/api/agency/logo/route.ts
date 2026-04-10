import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { uploadFile } from '@/lib/storage'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Archivo muy grande (máx 2MB)' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `logos/${session.user.agencyId}.${ext}`

  await uploadFile('project-files', path, buffer, file.type, true)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const logoUrl = `${supabaseUrl}/storage/v1/object/public/project-files/${path}`

  const agency = await prisma.agency.update({
    where: { id: session.user.agencyId },
    data: { logoUrl },
  })

  return NextResponse.json({ logoUrl: agency.logoUrl })
}
