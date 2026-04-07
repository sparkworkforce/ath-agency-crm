import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn({
      project: { create: vi.fn().mockResolvedValue({ id: 'proj-1', completionPercentage: 0 }) },
      task: { createMany: vi.fn().mockResolvedValue({ count: 5 }) },
    })),
    task: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    project: {
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    supportTicket: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue('storage-key'),
  BUCKETS: { PROJECT_FILES: 'project-files', CLIENT_UPLOADS: 'client-uploads' },
}))

vi.mock('@/lib/resend', () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
}))

import { prisma } from '@/lib/prisma'
import {
  recalculateCompletionPercentage,
  assertClientOwnership,
  createSupportTicket,
} from '../projects.service'

const mockPrisma = prisma as any

describe('recalculateCompletionPercentage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 0 when no tasks', async () => {
    mockPrisma.task.findMany.mockResolvedValue([])
    mockPrisma.project.update.mockResolvedValue({})
    const result = await recalculateCompletionPercentage('proj-1')
    expect(result).toBe(0)
  })

  it('calculates correct percentage', async () => {
    mockPrisma.task.findMany.mockResolvedValue([
      { status: 'completado' },
      { status: 'completado' },
      { status: 'pendiente' },
      { status: 'pendiente' },
    ])
    mockPrisma.project.update.mockResolvedValue({})
    const result = await recalculateCompletionPercentage('proj-1')
    expect(result).toBe(50)
  })

  it('returns 100 when all tasks completed', async () => {
    mockPrisma.task.findMany.mockResolvedValue([
      { status: 'completado' },
      { status: 'completado' },
    ])
    mockPrisma.project.update.mockResolvedValue({})
    const result = await recalculateCompletionPercentage('proj-1')
    expect(result).toBe(100)
  })
})

describe('assertClientOwnership', () => {
  it('does not throw when clientIds match', () => {
    expect(() => assertClientOwnership('client-1', 'client-1')).not.toThrow()
  })

  it('throws FORBIDDEN when clientIds do not match', () => {
    expect(() => assertClientOwnership('client-1', 'client-2')).toThrow('FORBIDDEN')
  })
})

describe('createSupportTicket', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates ticket with status abierto', async () => {
    mockPrisma.supportTicket.create.mockResolvedValue({ id: 'ticket-1', status: 'abierto' })
    await createSupportTicket('client-1', { title: 'Test', description: 'Desc' })
    expect(mockPrisma.supportTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'abierto', clientId: 'client-1' }),
      })
    )
  })
})
