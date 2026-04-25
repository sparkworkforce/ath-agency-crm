import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { z } from 'zod'

const FieldDefSchema = z.object({
  fields: z.array(z.object({
    key: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
    label: z.string().min(1).max(100),
    type: z.enum(['text', 'number', 'date', 'select']),
    options: z.array(z.string().max(100)).max(20).optional(),
    required: z.boolean().optional(),
  })).max(20),
})

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } })
  return NextResponse.json({ fields: (agency as any)?.customFields ?? [] })
}

export async function PUT(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = FieldDefSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid fields', details: result.error.flatten() }, { status: 400 })
  await (prisma.agency as any).update({ where: { id: session.user.agencyId }, data: { customFields: result.data.fields } }).catch(() => {})
  return NextResponse.json({ ok: true })
}
