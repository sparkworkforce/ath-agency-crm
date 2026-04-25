import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: { count: vi.fn(), groupBy: vi.fn() },
    project: { count: vi.fn(), findMany: vi.fn() },
    invoice: { findMany: vi.fn(), aggregate: vi.fn(), count: vi.fn() },
    task: { count: vi.fn() },
    payment: { aggregate: vi.fn() },
    projectFeedback: { aggregate: vi.fn() },
    timeEntry: { aggregate: vi.fn() },
    user: { count: vi.fn(), findMany: vi.fn() },
    agency: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/services/invoicing.service', () => ({
  getCurrentMonthRevenue: vi.fn().mockResolvedValue(5000),
  getMonthlyRevenueChart: vi.fn().mockResolvedValue([]),
}))

import { getDashboardMetrics, getOnboardingStatus } from '../dashboard.service'
import { prisma } from '@/lib/prisma'

const m = prisma as any

describe('getDashboardMetrics', () => {
  beforeEach(() => {
    // Full reset: clears implementations + call history
    for (const model of Object.values(m)) {
      if (model && typeof model === 'object') {
        for (const fn of Object.values(model as Record<string, any>)) {
          if (typeof fn?.mockReset === 'function') fn.mockReset()
        }
      }
    }
  })

  it('returns all expected metric fields', async () => {
    m.client.count.mockResolvedValue(5)
    m.project.count.mockResolvedValue(3)
    m.invoice.findMany.mockResolvedValue([])
    m.task.count.mockResolvedValue(1)
    m.invoice.aggregate.mockResolvedValue({ _sum: { totalAmount: 10000 }, _avg: { totalAmount: null } })
    m.project.findMany.mockResolvedValue([])
    m.payment.aggregate.mockResolvedValue({ _sum: { amount: 8000 } })
    m.projectFeedback.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } })
    m.timeEntry.aggregate.mockResolvedValue({ _sum: { minutes: 2400 } })
    m.user.count.mockResolvedValue(2)

    const result = await getDashboardMetrics('agency-1')

    expect(result).toHaveProperty('activeClientsCount')
    expect(result).toHaveProperty('monthlyRevenue')
    expect(result).toHaveProperty('collectionRate')
    expect(result).toHaveProperty('mrr')
    expect(result).toHaveProperty('satisfaction')
    expect(result).toHaveProperty('utilization')
    expect(result.activeClientsCount).toBe(5)
    expect(result.monthlyRevenue).toBe(5000)
    expect(result.satisfaction).toBe(4.5)
    expect(result.revenuePerClient).toBe(2000)
    expect(result.avgIntegrationDays).toBeNull()
  })
})

describe('getOnboardingStatus', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 5 checklist items', async () => {
    m.client.count.mockResolvedValue(1)
    m.project.count.mockResolvedValue(0)
    m.invoice.count.mockResolvedValue(0)
    m.user.count.mockResolvedValue(0)
    m.agency.findUnique.mockResolvedValue({ plan: 'FREE' })

    const items = await getOnboardingStatus('agency-1')

    expect(items).toHaveLength(5)
    expect(items[0].done).toBe(true)
    expect(items[1].done).toBe(false)
  })

  it('marks plan as done when not FREE', async () => {
    m.client.count.mockResolvedValue(0)
    m.project.count.mockResolvedValue(0)
    m.invoice.count.mockResolvedValue(0)
    m.user.count.mockResolvedValue(0)
    m.agency.findUnique.mockResolvedValue({ plan: 'PROFESSIONAL' })

    const items = await getOnboardingStatus('agency-1')

    const planItem = items.find((i: any) => i.key === 'plan')
    expect(planItem?.done).toBe(true)
  })
})
