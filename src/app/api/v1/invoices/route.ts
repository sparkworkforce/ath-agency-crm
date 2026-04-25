import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { CreateInvoiceSchema } from '@/lib/validations/invoices'
import { createInvoice } from '@/lib/services/invoicing.service'

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const invoices = await prisma.invoice.findMany({
    where: { client: { agencyId: agency.id, deletedAt: null } },
    select: { id: true, totalAmount: true, status: true, dueDate: true, isRetainer: true, createdAt: true, client: { select: { id: true, businessName: true } }, payments: { select: { id: true, amount: true, receivedAt: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invoices })
}

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError

  const result = CreateInvoiceSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })

  try {
    const invoice = await createInvoice(result.data, 'api', agency.id)
    return NextResponse.json({ invoice }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
