import { prisma } from './prisma'

export async function checkPlanLimit(agencyId: string, resource: 'clients' | 'users'): Promise<boolean> {
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } })
  if (!agency) return false

  if (resource === 'clients') {
    const count = await prisma.client.count({ where: { agencyId, deletedAt: null } })
    return count < agency.maxClients
  }

  if (resource === 'users') {
    const count = await prisma.user.count({ where: { agencyId, role: 'AGENCY', active: true } })
    return count < agency.maxUsers
  }

  return true
}
