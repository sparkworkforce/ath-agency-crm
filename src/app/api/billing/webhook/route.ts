import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
type AgencyPlan = 'FREE' | 'PROFESSIONAL' | 'BUSINESS'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const sub = event.data.object as any

  if (event.type === 'checkout.session.completed') {
    const agencyId = sub.metadata?.agencyId
    const plan = sub.metadata?.plan as AgencyPlan
    if (!agencyId || !plan) return NextResponse.json({ ok: true })

    const planConfig = PLANS[plan as keyof typeof PLANS]
    const subscription = await stripe.subscriptions.retrieve(sub.subscription) as any

    await prisma.agency.update({
      where: { id: agencyId },
      data: {
        plan,
        stripeSubId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        subStatus: subscription.status,
        subCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        maxClients: planConfig.maxClients,
        maxUsers: planConfig.maxUsers,
      },
    })
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const agency = await prisma.agency.findFirst({ where: { stripeSubId: sub.id } })
    if (!agency) return NextResponse.json({ ok: true })

    const data: any = {
      subStatus: sub.status,
      subCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
    }

    if (sub.status === 'canceled' || event.type === 'customer.subscription.deleted') {
      data.plan = 'FREE'
      data.maxClients = PLANS.FREE.maxClients
      data.maxUsers = PLANS.FREE.maxUsers
    }

    await prisma.agency.update({ where: { id: agency.id }, data })
  }

  return NextResponse.json({ ok: true })
}
