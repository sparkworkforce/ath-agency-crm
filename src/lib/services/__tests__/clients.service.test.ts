import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn({
      client: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
      clientStatusHistory: { create: vi.fn() },
      user: { findMany: vi.fn().mockResolvedValue([]) },
      magicLink: { updateMany: vi.fn() },
    })),
    client: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    communication: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/services/auth.service', () => ({
  generateMagicLinkToken: vi.fn().mockResolvedValue('mock-token'),
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
  revokeAllUserSessions: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'
import { searchClients, inviteClientUser } from '../clients.service'

const mockPrisma = prisma as any

describe('searchClients', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only non-deleted clients', async () => {
    mockPrisma.client.findMany.mockResolvedValue([{ id: '1', businessName: 'Test' }])
    const result = await searchClients('agency-1')
    expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) })
    )
    expect(result).toHaveLength(1)
  })

  it('filters by query when provided', async () => {
    mockPrisma.client.findMany.mockResolvedValue([])
    await searchClients('agency-1', 'test')
    expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      })
    )
  })
})

describe('inviteClientUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws CLIENT_NOT_FOUND when client does not exist', async () => {
    mockPrisma.client.findFirst.mockResolvedValue(null)
    await expect(inviteClientUser('bad-id', 'test@test.com', 'Test', 'agency-1')).rejects.toThrow('CLIENT_NOT_FOUND')
  })

  it('throws EMAIL_ALREADY_EXISTS when user with email exists', async () => {
    mockPrisma.client.findFirst.mockResolvedValue({ id: 'client-1' })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' })
    await expect(inviteClientUser('client-1', 'existing@test.com', 'Test', 'agency-1')).rejects.toThrow('EMAIL_ALREADY_EXISTS')
  })
})
