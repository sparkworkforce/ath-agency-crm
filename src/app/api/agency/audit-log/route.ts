import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const logs = await prisma.invoiceAuditLog.findMany({
    where: { invoice: { client: { agencyId: session.user.agencyId } } },
    include: { invoice: { select: { id: true, totalAmount: true, client: { select: { businessName: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json({ logs })
}
