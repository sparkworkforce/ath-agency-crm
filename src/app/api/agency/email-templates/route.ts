import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { z } from 'zod'

const EmailTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  trigger: z.enum(['invoice_reminder', 'milestone', 'portal_invite', 'payment_receipt', 'custom']),
})

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } })
  return NextResponse.json({ templates: (agency as any)?.emailTemplates ?? [] })
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = EmailTemplateSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Invalid template', details: result.error.flatten() }, { status: 400 })

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } })
  const existing = ((agency as any)?.emailTemplates as any[]) ?? []
  const newTemplate = { id: crypto.randomUUID(), ...result.data, createdAt: new Date().toISOString() }
  await (prisma.agency as any).update({ where: { id: session.user.agencyId }, data: { emailTemplates: [...existing, newTemplate] } }).catch(() => {})

  return NextResponse.json({ template: newTemplate }, { status: 201 })
}
