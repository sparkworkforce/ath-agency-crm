import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { safeParseBody } from '@/lib/safe-parse-body'

const PROCESSORS = ['ath_business', 'ath_movil', 'paypal', 'stripe_connect', 'square', 'mercado_pago'] as const

const IntegrationUpdateSchema = z.object({
  processor: z.enum(PROCESSORS).optional().default('ath_business'),
  accountStatus: z.enum(['pending', 'submitted', 'approved', 'active', 'rejected']).optional(),
  publicToken: z.string().optional(),
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

  const integrations = await prisma.integrationStatus.findMany({ where: { projectId: id }, orderBy: { updatedAt: 'desc' } })
  return NextResponse.json({ integrations, processors: PROCESSORS })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, client: { agencyId: session.user.agencyId } } })
  if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = IntegrationUpdateSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { processor, ...data } = result.data
  const updateData: Record<string, unknown> = { ...data }
  if (updateData.goLiveAt) updateData.goLiveAt = new Date(updateData.goLiveAt as string)
  if (updateData.testTransactionOk !== undefined) updateData.testTransactionAt = new Date()

  const status = await prisma.integrationStatus.upsert({
    where: { projectId_processor: { projectId: id, processor } },
    create: { projectId: id, processor, ...updateData },
    update: updateData,
  })

  return NextResponse.json({ status })
}
