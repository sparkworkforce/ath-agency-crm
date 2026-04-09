import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request.headers.get('x-api-key') ?? 'anon')
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const projects = await prisma.project.findMany({
    where: { client: { agencyId: agency.id, deletedAt: null } },
    select: { id: true, name: true, completionPercentage: true, estimatedCompletionDate: true, createdAt: true, client: { select: { id: true, businessName: true } }, tasks: { select: { id: true, title: true, status: true, order: true }, orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ projects })
}
