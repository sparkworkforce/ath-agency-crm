import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/storage', () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
  BUCKETS: { PROJECT_FILES: 'project-files', CLIENT_UPLOADS: 'client-uploads' },
}))

import { prisma } from '@/lib/prisma'
import { purgeExpiredClients } from '../retention.service'

const mockPrisma = prisma as any

describe('purgeExpiredClients', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns zero counts when no expired clients', async () => {
    mockPrisma.client.findMany.mockResolvedValue([])
    const result = await purgeExpiredClients()
    expect(result).toEqual({ purged: 0, errors: 0 })
  })

  it('purges client and counts correctly', async () => {
    mockPrisma.client.findMany.mockResolvedValue([
      { id: 'client-1', projects: [], users: [] },
    ])
    mockPrisma.client.delete.mockResolvedValue({})
    const result = await purgeExpiredClients()
    expect(result.purged).toBe(1)
    expect(result.errors).toBe(0)
  })

  it('counts errors when delete fails', async () => {
    mockPrisma.client.findMany.mockResolvedValue([
      { id: 'client-1', projects: [], users: [] },
    ])
    mockPrisma.client.delete.mockRejectedValue(new Error('DB error'))
    const result = await purgeExpiredClients()
    expect(result.purged).toBe(0)
    expect(result.errors).toBe(1)
  })
})
