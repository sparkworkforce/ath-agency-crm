import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (!session.user.clientId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const invoices = await prisma.invoice.findMany({
    where: { clientId: session.user.clientId },
    include: { lineItems: true, payments: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ invoices })
}
