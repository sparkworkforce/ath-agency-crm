import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn({
      invoice: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      payment: { create: vi.fn() },
      invoiceAuditLog: { create: vi.fn() },
    })),
    invoice: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    invoiceAuditLog: { create: vi.fn() },
    payment: { aggregate: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock('@/lib/resend', () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
}))

import { prisma } from '@/lib/prisma'
import { getCurrentMonthRevenue, getMonthlyRevenueChart } from '../invoicing.service'

const mockPrisma = prisma as any

describe('getCurrentMonthRevenue', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 0 when no payments', async () => {
    mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: null } })
    const result = await getCurrentMonthRevenue()
    expect(result).toBe(0)
  })

  it('returns correct sum', async () => {
    mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 1500.50 } })
    const result = await getCurrentMonthRevenue()
    expect(result).toBe(1500.50)
  })
})

describe('getMonthlyRevenueChart', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 6 months of data with zero for empty months', async () => {
    mockPrisma.payment.findMany.mockResolvedValue([])
    const result = await getMonthlyRevenueChart(6)
    expect(result).toHaveLength(6)
    expect(result.every((r) => r.revenue === 0)).toBe(true)
    expect(result.every((r) => typeof r.month === 'string')).toBe(true)
  })
})
