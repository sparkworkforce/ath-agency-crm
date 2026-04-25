import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { CreateClientSchema } from '@/lib/validations/clients'
import { createClient } from '@/lib/services/clients.service'

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const clients = await prisma.client.findMany({
    where: { agencyId: agency.id, deletedAt: null },
    select: { id: true, businessName: true, contactName: true, contactEmail: true, platform: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ clients })
}

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError

  const result = CreateClientSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })

  try {
    const client = await createClient(result.data, 'api', agency.id)
    return NextResponse.json({ client }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
