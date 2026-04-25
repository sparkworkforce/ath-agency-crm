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

  let imported = 0
  const errors: { row: number; error: string }[] = []

  for (let i = 0; i < result.data.rows.length; i++) {
    const row = result.data.rows[i]
    try {
      const existing = await prisma.client.findFirst({ where: { agencyId, contactEmail: row.contactEmail, deletedAt: null } })
      if (existing) { errors.push({ row: i, error: `Duplicate email: ${row.contactEmail}` }); continue }

      await prisma.client.create({
        data: { ...row, agencyId, contactPhone: row.contactPhone ?? null },
      })
      imported++
    } catch {
      errors.push({ row: i, error: 'Failed to create client' })
    }
  }

  return NextResponse.json({ imported, errors, total: result.data.rows.length })
}
