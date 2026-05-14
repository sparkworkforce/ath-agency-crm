import { prisma } from '../prisma'
import {
  generateMagicLinkToken,
  sendMagicLinkEmail,
  revokeAllUserSessions,
} from './auth.service'
import type { CreateClientInput, UpdateClientStatusInput, CreateCommunicationInput } from '../validations/clients'
import { paginationArgs, paginated, type PaginationInput, type PaginatedResult } from '../pagination'
import type { ClientStatus } from '../../../prisma/generated/prisma/client'
import type { AgencyBranding } from '../email'

export async function createClient(data: CreateClientInput, createdBy: string, agencyId: string) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        ...data,
        agencyId,
        status: 'prospecto',
      },
    })
    await tx.clientStatusHistory.create({
      data: { clientId: client.id, status: 'prospecto', changedBy: createdBy },
    })
    return client
  })
}

export async function updateClient(clientId: string, data: Partial<CreateClientInput>, agencyId: string) {
  return prisma.client.update({
    where: { id: clientId, agencyId, deletedAt: null },
    data,
  })
}

export async function updateClientStatus(
  clientId: string,
  status: ClientStatus,
  changedBy: string,
  agencyId: string
) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.update({
      where: { id: clientId, agencyId, deletedAt: null },
      data: { status },
    })
    await tx.clientStatusHistory.create({
      data: { clientId, status, changedBy },
    })
    return client
  })
}

export async function searchClients(agencyId: string, query?: string, pagination?: undefined): Promise<any[]>
export async function searchClients(agencyId: string, query: string | undefined, pagination: PaginationInput): Promise<PaginatedResult<any>>
export async function searchClients(agencyId: string, query?: string, pagination?: PaginationInput) {
  const where = {
    agencyId,
    deletedAt: null,
    ...(query
      ? {
          OR: [
            { businessName: { contains: query, mode: 'insensitive' as const } },
            { contactEmail: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  if (!pagination) {
    return prisma.client.findMany({ where, orderBy: { createdAt: 'desc' } })
  }

  const [data, total] = await Promise.all([
    prisma.client.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginationArgs(pagination) }),
    prisma.client.count({ where }),
  ])
  return paginated(data, total, pagination)
}

export async function getClientById(clientId: string, agencyId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, agencyId, deletedAt: null },
    include: { statusHistory: { orderBy: { changedAt: 'desc' } }, tags: true },
  })
}

export async function logCommunication(
  clientId: string,
  data: CreateCommunicationInput,
  createdBy: string,
  agencyId: string
) {
  // Verify client belongs to agency
  const client = await prisma.client.findFirst({ where: { id: clientId, agencyId, deletedAt: null } })
  if (!client) throw new Error('CLIENT_NOT_FOUND')

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

export async function getCommunications(clientId: string, agencyId: string) {
  return prisma.communication.findMany({
    where: { clientId, client: { agencyId } },
    orderBy: { date: 'desc' },
  })
}

export async function inviteClientUser(
  clientId: string,
  email: string,
  name: string,
  agencyId: string,
  agency?: AgencyBranding
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId, deletedAt: null },
  })
  if (!client) throw new Error('CLIENT_NOT_FOUND')

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new Error('EMAIL_ALREADY_EXISTS')

  const user = await prisma.user.create({
    data: { email, name, role: 'CLIENT', clientId, active: true },
  })

  const token = await generateMagicLinkToken(user.id)
  await sendMagicLinkEmail(email, token, name, agency)

  return user
}

export async function softDeleteClient(clientId: string, agencyId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, agencyId, deletedAt: null } })
  if (!client) throw new Error('CLIENT_NOT_FOUND')

  const users = await prisma.user.findMany({ where: { clientId } })

  await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId, agencyId, deletedAt: null },
      data: { deletedAt: new Date() },
    })
    await tx.communication.create({
      data: { clientId, channel: 'system', summary: 'Client deleted', date: new Date(), createdBy: 'system' },
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
