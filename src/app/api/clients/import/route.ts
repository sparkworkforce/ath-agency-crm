import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { rateLimit } from '@/lib/rate-limit'
import { checkPlanLimit } from '@/lib/plan-gating'
import { safeParseBody } from '@/lib/safe-parse-body'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const RowSchema = z.object({
  businessName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(100),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(20).optional(),
  platform: z.enum(['WOOCOMMERCE', 'SHOPIFY', 'CUSTOM']).default('CUSTOM'),
  status: z.enum(['prospecto', 'en_progreso', 'completado', 'soporte_mensual']).default('prospecto'),
})

const ImportSchema = z.object({ rows: z.array(RowSchema).min(1).max(500) })

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError

  const result = ImportSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })

  const agencyId = session.user.agencyId

  // Check plan limits before importing
  const allowed = await checkPlanLimit(agencyId, 'clients')
  if (!allowed) return NextResponse.json({ error: 'Client limit reached. Upgrade your plan.' }, { status: 403 })

  // Check exact count to prevent exceeding limit
  const currentCount = await prisma.client.count({ where: { agencyId, deletedAt: null } })
  const agency = await prisma.agency.findUnique({ where: { id: agencyId }, select: { maxClients: true } })
  if (agency && currentCount + result.data.rows.length > agency.maxClients) {
    return NextResponse.json({ error: `Import would exceed client limit (${agency.maxClients}). You have ${currentCount} clients.` }, { status: 403 })
  }

  let imported = 0
  const errors: { row: number; error: string }[] = []

  // Check for duplicates first
  const emails = result.data.rows.map(r => r.contactEmail)
  const existing = await prisma.client.findMany({ where: { agencyId, contactEmail: { in: emails }, deletedAt: null }, select: { contactEmail: true } })
  const existingEmails = new Set(existing.map(e => e.contactEmail))

  const validRows = result.data.rows.filter((row, i) => {
    if (existingEmails.has(row.contactEmail)) { errors.push({ row: i, error: `Duplicate email: ${row.contactEmail}` }); return false }
    return true
  })

  if (validRows.length > 0) {
    try {
      await prisma.$transaction(async (tx) => {
        const { count } = await tx.client.createMany({
          data: validRows.map(row => ({ ...row, agencyId, contactPhone: row.contactPhone ?? null })),
          skipDuplicates: true,
        })
        imported = count
      })
    } catch {
      return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ imported, errors, total: result.data.rows.length })
}
