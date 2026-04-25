import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: { create: vi.fn(), createMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}))

import { createNotification, notifyAgencyUsers } from '../notification.service'
import { prisma } from '@/lib/prisma'

const mockPrisma = vi.mocked(prisma)

beforeEach(() => { vi.clearAllMocks() })

describe('createNotification', () => {
  it('creates a notification with required fields', async () => {
    mockPrisma.notification.create.mockResolvedValue({ id: '1' } as any)

    await createNotification({ userId: 'user-1', title: 'Test', body: 'Body text' })

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', title: 'Test', body: 'Body text' }),
    })
  })

  it('passes optional link when provided', async () => {
    mockPrisma.notification.create.mockResolvedValue({ id: '2' } as any)

    await createNotification({ userId: 'user-1', title: 'Test', body: 'Body', link: '/clients' })

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ link: '/clients' }),
    })
  })
})

describe('notifyAgencyUsers', () => {
  it('creates notifications for all active agency users', async () => {
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }] as any)
    mockPrisma.notification.createMany.mockResolvedValue({ count: 2 })

    await notifyAgencyUsers('agency-1', 'New client', 'A new client was added')

    expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ userId: 'u1', title: 'New client', body: 'A new client was added' }),
        expect.objectContaining({ userId: 'u2', title: 'New client', body: 'A new client was added' }),
      ],
    })
  })

  it('does nothing when no users found', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])

    await notifyAgencyUsers('agency-1', 'Test', 'Body')

    expect(mockPrisma.notification.createMany).not.toHaveBeenCalled()
  })
})
