import { prisma } from './prisma'
import type { AgencyPlan } from '../../prisma/generated/prisma/client'

type AgencyWithTrial = { plan: AgencyPlan; trialEndsAt: Date | null; stripeSubId?: string | null }

export function getEffectivePlan(agency: AgencyWithTrial): AgencyPlan {
  if (agency.plan !== 'FREE' && agency.trialEndsAt && agency.trialEndsAt < new Date() && !agency.stripeSubId) {
    return 'FREE'
  }
  return agency.plan
}

export async function checkPlanLimit(agencyId: string, resource: 'clients' | 'users'): Promise<boolean> {
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } })
  if (!agency) return false

  const effectivePlan = getEffectivePlan(agency)

  if (resource === 'clients') {
    const count = await prisma.client.count({ where: { agencyId, deletedAt: null } })
    const limit = effectivePlan === 'FREE' ? 3 : effectivePlan === 'PROFESSIONAL' ? 25 : 999
    return count < limit
  }

  if (resource === 'users') {
    const count = await prisma.user.count({ where: { agencyId, role: 'AGENCY', active: true } })
    const limit = effectivePlan === 'FREE' ? 1 : effectivePlan === 'PROFESSIONAL' ? 5 : 99
    return count < limit
  }

  return true
}
