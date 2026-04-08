import { NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId } })
  if (!agency?.stripeCustomerId) return NextResponse.json({ error: 'No hay suscripción activa' }, { status: 400 })

  const portal = await stripe.billingPortal.sessions.create({
    customer: agency.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings`,
  })

  return NextResponse.json({ url: portal.url })
}
