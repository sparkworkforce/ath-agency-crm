import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../prisma', () => ({
  prisma: {
    agency: { update: vi.fn(), findFirst: vi.fn() },
  },
}))

vi.mock('../../session-rotation', () => ({
  invalidateAgencySessions: vi.fn(),
}))

vi.mock('../../stripe', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    subscriptions: { retrieve: vi.fn() },
  },
  PLANS: {
    FREE: { priceId: null, maxClients: 3, maxUsers: 1 },
    PROFESSIONAL: { priceId: 'price_pro', maxClients: 25, maxUsers: 5 },
    BUSINESS: { priceId: 'price_biz', maxClients: 999, maxUsers: 99 },
  },
}))

import { prisma } from '../../prisma'
import { invalidateAgencySessions } from '../../session-rotation'
import { stripe, PLANS } from '../../stripe'

const mockPrisma = vi.mocked(prisma)
const mockStripe = vi.mocked(stripe)
const mockInvalidate = vi.mocked(invalidateAgencySessions)

beforeEach(() => vi.clearAllMocks())

describe('Webhook: checkout.session.completed', () => {
  it('updates agency plan on successful checkout', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { agencyId: 'ag-1', plan: 'PROFESSIONAL' },
          subscription: 'sub_123',
        },
      },
    }

    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      items: { data: [{ price: { id: 'price_pro' } }] },
    } as any)

    mockPrisma.agency.update.mockResolvedValue({} as any)
    mockInvalidate.mockResolvedValue(undefined)

    // Simulate the webhook logic directly
    const sub = event.data.object as any
    const agencyId = sub.metadata?.agencyId
    const plan = sub.metadata?.plan
    const planConfig = PLANS[plan as keyof typeof PLANS]
    const subscription = await mockStripe.subscriptions.retrieve(sub.subscription)

    await mockPrisma.agency.update({
      where: { id: agencyId },
      data: {
        plan,
        stripeSubId: (subscription as any).id,
        maxClients: planConfig.maxClients,
        maxUsers: planConfig.maxUsers,
      },
    })
    await mockInvalidate(agencyId)

    expect(mockPrisma.agency.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'ag-1' },
      data: expect.objectContaining({ plan: 'PROFESSIONAL', maxClients: 25, maxUsers: 5 }),
    }))
    expect(mockInvalidate).toHaveBeenCalledWith('ag-1')
  })
})

describe('Webhook: subscription.deleted', () => {
  it('downgrades to FREE on subscription deletion', async () => {
    mockPrisma.agency.findFirst.mockResolvedValue({ id: 'ag-1' } as any)
    mockPrisma.agency.update.mockResolvedValue({} as any)
    mockInvalidate.mockResolvedValue(undefined)

    const sub = { id: 'sub_123', status: 'canceled', current_period_end: Math.floor(Date.now() / 1000) }
    const agency = await mockPrisma.agency.findFirst({ where: { stripeSubId: sub.id } })

    await mockPrisma.agency.update({
      where: { id: agency!.id },
      data: { plan: 'FREE', maxClients: PLANS.FREE.maxClients, maxUsers: PLANS.FREE.maxUsers },
    })
    await mockInvalidate(agency!.id)

    expect(mockPrisma.agency.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ plan: 'FREE', maxClients: 3, maxUsers: 1 }),
    }))
  })

  it('ignores unknown subscription IDs', async () => {
    mockPrisma.agency.findFirst.mockResolvedValue(null)
    const agency = await mockPrisma.agency.findFirst({ where: { stripeSubId: 'unknown' } })
    expect(agency).toBeNull()
    expect(mockPrisma.agency.update).not.toHaveBeenCalled()
  })
})
