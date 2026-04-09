import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request.headers.get('x-api-key') ?? 'anon')
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
