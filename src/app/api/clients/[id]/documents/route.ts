import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { uploadFile, BUCKETS } from '@/lib/storage'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const { id } = await params

  const client = await prisma.client.findFirst({ where: { id, agencyId: session.user.agencyId, deletedAt: null } })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const docs = await prisma.communication.findMany({
    where: { clientId: id, channel: 'document' },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json({ documents: docs })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const { id } = await params

  const client = await prisma.client.findFirst({ where: { id, agencyId: session.user.agencyId, deletedAt: null } })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const rawDocType = (formData.get('type') as string) ?? 'other'
  const docType = ['contract', 'nda', 'credentials', 'invoice', 'other'].includes(rawDocType) ? rawDocType : 'other'
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })

  const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  const key = `client-docs/${id}/${Date.now()}-${fileName}`

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadFile(BUCKETS.CLIENT_UPLOADS, key, buffer, file.type)
    const doc = await prisma.communication.create({
      data: { clientId: id, channel: 'document', summary: `${docType}: ${fileName}`, date: new Date(), createdBy: session.user.id },
    })
    return NextResponse.json({ document: { ...doc, url } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
