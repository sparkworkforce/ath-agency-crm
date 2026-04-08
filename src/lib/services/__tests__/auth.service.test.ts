import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma before importing the service
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn({
      magicLink: { findUnique: vi.fn(), update: vi.fn() },
    })),
    magicLink: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    loginAttempt: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/resend', () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  generateMagicLinkToken,
  consumeMagicLinkToken,
  checkIfLocked,
  checkAndIncrementLoginAttempts,
  resetLoginAttempts,
  revokeAllUserSessions,
} from '../auth.service'

const mockPrisma = prisma as any

describe('generateMagicLinkToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invalidates existing active links and creates a new one', async () => {
    mockPrisma.magicLink.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.magicLink.create.mockResolvedValue({ token: 'test-token' })

    const token = await generateMagicLinkToken('user-123')

    expect(mockPrisma.magicLink.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-123' }) })
    )
    expect(mockPrisma.magicLink.create).toHaveBeenCalled()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })
})

describe('consumeMagicLinkToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns invalid when token does not exist', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({ magicLink: { findUnique: vi.fn().mockResolvedValue(null), update: vi.fn() } })
    )
    const result = await consumeMagicLinkToken('nonexistent')
    expect(result).toEqual({ valid: false, reason: 'invalid' })
  })

  it('returns used when token has usedAt set', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({ magicLink: { findUnique: vi.fn().mockResolvedValue({
        token: 'used-token', usedAt: new Date(), expiresAt: new Date(Date.now() + 10000),
      }), update: vi.fn() } })
    )
    const result = await consumeMagicLinkToken('used-token')
    expect(result).toEqual({ valid: false, reason: 'used' })
  })

  it('returns expired when token is past expiresAt', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({ magicLink: { findUnique: vi.fn().mockResolvedValue({
        token: 'expired-token', usedAt: null, expiresAt: new Date(Date.now() - 1000),
      }), update: vi.fn() } })
    )
    const result = await consumeMagicLinkToken('expired-token')
    expect(result).toEqual({ valid: false, reason: 'expired' })
  })

  it('returns valid and marks token used atomically', async () => {
    const mockUpdate = vi.fn()
    mockPrisma.$transaction.mockImplementation(async (fn: any) =>
      fn({ magicLink: { findUnique: vi.fn().mockResolvedValue({
        id: 'link-1', token: 'valid-token', userId: 'user-123', usedAt: null,
        expiresAt: new Date(Date.now() + 100000),
      }), update: mockUpdate } })
    )
    const result = await consumeMagicLinkToken('valid-token')
    expect(result).toEqual({ valid: true, userId: 'user-123' })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'link-1' },
    }))
  })
})

describe('checkIfLocked', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not throw when no record exists', async () => {
    mockPrisma.loginAttempt.findUnique.mockResolvedValue(null)
    await expect(checkIfLocked('test@example.com')).resolves.not.toThrow()
  })

  it('does not throw when lockedUntil is in the past', async () => {
    mockPrisma.loginAttempt.findUnique.mockResolvedValue({
      lockedUntil: new Date(Date.now() - 1000),
    })
    await expect(checkIfLocked('test@example.com')).resolves.not.toThrow()
  })

  it('throws RATE_LIMITED when lockedUntil is in the future', async () => {
    mockPrisma.loginAttempt.findUnique.mockResolvedValue({
      lockedUntil: new Date(Date.now() + 10000),
    })
    await expect(checkIfLocked('test@example.com')).rejects.toThrow('RATE_LIMITED')
  })
})

describe('checkAndIncrementLoginAttempts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts the login attempt record', async () => {
    mockPrisma.loginAttempt.upsert.mockResolvedValue({ attempts: 1 })
    await checkAndIncrementLoginAttempts('test@example.com')
    expect(mockPrisma.loginAttempt.upsert).toHaveBeenCalled()
  })

  it('sets lockedUntil after 5 or more attempts', async () => {
    mockPrisma.loginAttempt.upsert.mockResolvedValue({ attempts: 5 })
    mockPrisma.loginAttempt.update.mockResolvedValue({})
    await checkAndIncrementLoginAttempts('test@example.com')
    expect(mockPrisma.loginAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lockedUntil: expect.any(Date) }),
      })
    )
  })
})

describe('resetLoginAttempts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('resets attempts to 0 and clears lockedUntil', async () => {
    mockPrisma.loginAttempt.upsert.mockResolvedValue({ attempts: 0 })
    await resetLoginAttempts('test@example.com')
    expect(mockPrisma.loginAttempt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ attempts: 0, lockedUntil: null }),
      })
    )
  })
})

describe('revokeAllUserSessions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes all sessions for the user', async () => {
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 2 })
    await revokeAllUserSessions('user-123')
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    })
  })
})
