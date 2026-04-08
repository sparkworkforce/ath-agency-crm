import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const IntegrationUpdateSchema = z.object({
  athAccountStatus: z.enum(['pending', 'submitted', 'approved', 'active', 'rejected']).optional(),
  athPublicToken: z.string().optional(),
  environment: z.enum(['sandbox', 'production']).optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
  webhookVerified: z.boolean().optional(),
  testTransactionOk: z.boolean().nullable().optional(),
  goLiveAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
}).strict()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, client: { agencyId: session.user.agencyId } } })
  if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const status = await prisma.integrationStatus.findUnique({ where: { projectId: id } })
  return NextResponse.json({ status })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, client: { agencyId: session.user.agencyId } } })
  if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const body = await request.json()
  const result = IntegrationUpdateSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const data: any = { ...result.data }
  if (data.goLiveAt) data.goLiveAt = new Date(data.goLiveAt)
  if (data.testTransactionOk !== undefined) data.testTransactionAt = new Date()

  const status = await prisma.integrationStatus.upsert({
    where: { projectId: id },
    create: { projectId: id, ...data },
    update: data,
  })

  return NextResponse.json({ status })
}
