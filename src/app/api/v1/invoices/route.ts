import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { CreateInvoiceSchema } from '@/lib/validations/invoices'
import { createInvoice } from '@/lib/services/invoicing.service'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'X-API-Key, Content-Type', 'API-Version': '1' }

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50))
  const skip = (page - 1) * limit

  const where = { client: { agencyId: agency.id, deletedAt: null } }
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      select: { id: true, totalAmount: true, status: true, dueDate: true, isRetainer: true, createdAt: true, client: { select: { id: true, businessName: true } }, payments: { select: { id: true, amount: true, receivedAt: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ])

  return NextResponse.json({ invoices, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, { headers: corsHeaders })
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
    return NextResponse.json({ invoice }, { status: 201, headers: corsHeaders })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
