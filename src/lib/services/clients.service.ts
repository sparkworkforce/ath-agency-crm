import { prisma } from '../prisma'
import {
  generateMagicLinkToken,
  sendMagicLinkEmail,
  revokeAllUserSessions,
} from './auth.service'
import type { CreateClientInput, UpdateClientStatusInput, CreateCommunicationInput } from '../validations/clients'
import type { ClientStatus } from '../../../prisma/generated/prisma/client'

export async function createClient(data: CreateClientInput, createdBy: string) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        ...data,
        status: 'prospecto',
      },
    })
    await tx.clientStatusHistory.create({
      data: { clientId: client.id, status: 'prospecto', changedBy: createdBy },
    })
    return client
  })
}

export async function updateClient(clientId: string, data: Partial<CreateClientInput>) {
  return prisma.client.update({
    where: { id: clientId, deletedAt: null },
    data,
  })
}

export async function updateClientStatus(
  clientId: string,
  status: ClientStatus,
  changedBy: string
) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.update({
      where: { id: clientId, deletedAt: null },
      data: { status },
    })
    await tx.clientStatusHistory.create({
      data: { clientId, status, changedBy },
    })
    return client
  })
}

export async function searchClients(query?: string) {
  return prisma.client.findMany({
    where: {
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { businessName: { contains: query, mode: 'insensitive' } },
              { contactEmail: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getClientById(clientId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
    include: { statusHistory: { orderBy: { changedAt: 'desc' } } },
  })
}

export async function logCommunication(
  clientId: string,
  data: CreateCommunicationInput,
  createdBy: string
) {
  return prisma.communication.create({
    data: {
      clientId,
      date: new Date(data.date),
      channel: data.channel,
      summary: data.summary,
      createdBy,
    },
  })
}

export async function getCommunications(clientId: string) {
  return prisma.communication.findMany({
    where: { clientId },
    orderBy: { date: 'desc' },
  })
}

export async function inviteClientUser(
  clientId: string,
  email: string,
  name: string
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, deletedAt: null },
  })
  if (!client) throw new Error('CLIENT_NOT_FOUND')

  const existing = await prisma.user.findFirst({
    where: { email, active: true },
  })
  if (existing) throw new Error('EMAIL_ALREADY_EXISTS')

  const user = await prisma.user.create({
    data: { email, name, role: 'CLIENT', clientId, active: true },
  })

  const token = await generateMagicLinkToken(user.id)
  await sendMagicLinkEmail(email, token, name)

  return user
}

export async function softDeleteClient(clientId: string) {
  // Get users before transaction to avoid deadlock
  const users = await prisma.user.findMany({ where: { clientId } })

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: { deletedAt: new Date() },
    })
    for (const user of users) {
      await tx.magicLink.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      })
    }
  })

  // Revoke sessions outside transaction (uses separate connection)
  for (const user of users) {
    await revokeAllUserSessions(user.id)
  }
}
