import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: { count: vi.fn() },
    agency: { findUnique: vi.fn() },
    user: { count: vi.fn() },
    codeSnippet: { count: vi.fn() },
  },
}))

import { getEffectivePlan, checkPlanLimit } from '../plan-gating'
import { prisma } from '@/lib/prisma'

const mockPrisma = vi.mocked(prisma)

describe('getEffectivePlan', () => {
  it('returns the plan when no trial', () => {
    expect(getEffectivePlan({ plan: 'PROFESSIONAL', trialEndsAt: null })).toBe('PROFESSIONAL')
  })

  it('downgrades to FREE when trial expired and no subscription', () => {
    const expired = new Date(Date.now() - 86400000)
    expect(getEffectivePlan({ plan: 'PROFESSIONAL', trialEndsAt: expired, stripeSubId: null })).toBe('FREE')
  })

  it('keeps plan when trial expired but has subscription', () => {
    const expired = new Date(Date.now() - 86400000)
    expect(getEffectivePlan({ plan: 'PROFESSIONAL', trialEndsAt: expired, stripeSubId: 'sub_123' })).toBe('PROFESSIONAL')
  })
})

describe('checkPlanLimit', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns false when agency not found', async () => {
    mockPrisma.agency.findUnique.mockResolvedValue(null)
    expect(await checkPlanLimit('bad-id', 'clients')).toBe(false)
  })

  it('allows clients under FREE limit', async () => {
    mockPrisma.agency.findUnique.mockResolvedValue({ plan: 'FREE', trialEndsAt: null } as any)
    mockPrisma.client.count.mockResolvedValue(2)
    expect(await checkPlanLimit('a1', 'clients')).toBe(true)
  })

  it('blocks clients at FREE limit', async () => {
    mockPrisma.agency.findUnique.mockResolvedValue({ plan: 'FREE', trialEndsAt: null } as any)
    mockPrisma.client.count.mockResolvedValue(3)
    expect(await checkPlanLimit('a1', 'clients')).toBe(false)
  })
})
