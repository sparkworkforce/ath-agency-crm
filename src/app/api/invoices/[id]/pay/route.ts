import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const invoice = await prisma.invoice.findFirst({
    where: { id, client: { agencyId: session.user.agencyId } },
    include: { client: true, lineItems: true },
  })
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.status === 'pagado') return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })

  const totalCents = Math.round(Number(invoice.totalAmount) * 100)
  if (totalCents <= 0) return NextResponse.json({ error: 'Invalid invoice amount' }, { status: 400 })

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Invoice #${invoice.id.slice(-8).toUpperCase()} — ${invoice.client.businessName}` },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      metadata: { invoiceId: invoice.id, agencyId: session.user.agencyId },
      success_url: `${process.env.NEXTAUTH_URL}/invoices/${invoice.id}?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/invoices/${invoice.id}?payment=cancel`,
    })

    return NextResponse.json({ url: checkout.url })
  } catch {
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
  }
}
