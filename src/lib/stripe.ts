import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop]
  },
})

export const PLANS = {
  FREE:         { priceId: null,                                    maxClients: 3,   maxUsers: 1  },
  PROFESSIONAL: { priceId: process.env.STRIPE_PRICE_PROFESSIONAL,  maxClients: 25,  maxUsers: 5  },
  BUSINESS:     { priceId: process.env.STRIPE_PRICE_BUSINESS,      maxClients: 999, maxUsers: 99 },
} as const
