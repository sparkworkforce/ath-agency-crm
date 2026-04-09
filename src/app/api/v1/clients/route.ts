import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request.headers.get('x-api-key') ?? 'anon')
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
