import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getInvoiceById } from '@/lib/services/invoicing.service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const invoice = await getInvoiceById(id)
  if (!invoice) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ invoice })
}
