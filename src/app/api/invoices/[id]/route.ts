import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { getInvoiceById } from '@/lib/services/invoicing.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const invoice = await getInvoiceById(id, session.user.agencyId)
  if (!invoice) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ invoice })
}
