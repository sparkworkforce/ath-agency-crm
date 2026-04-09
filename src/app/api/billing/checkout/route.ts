import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { stripe, PLANS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  // Block demo accounts from billing
  const ag = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { slug: true } })
  if (ag?.slug.startsWith('demo-')) return NextResponse.json({ error: 'Demo accounts cannot access billing' }, { status: 403 })

  const { plan } = await request.json()
  if (plan !== 'PROFESSIONAL' && plan !== 'BUSINESS') return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  const planConfig = PLANS[plan as keyof typeof PLANS]

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } })
  if (!agency) return NextResponse.json({ error: 'Agencia no encontrada' }, { status: 404 })

  // Create or retrieve Stripe customer
  let customerId = agency.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { agencyId: agency.id },
    })
    customerId = customer.id
    await prisma.agency.update({ where: { id: agency.id }, data: { stripeCustomerId: customerId } })
  }

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: planConfig.priceId!, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/settings?billing=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/settings?billing=cancel`,
    metadata: { agencyId: agency.id, plan },
  })

  return NextResponse.json({ url: checkout.url })
}
