import { prisma } from '../prisma'

export type HealthLevel = 'green' | 'yellow' | 'red'

export interface ClientHealth {
  clientId: string
  score: number // 0-100
  level: HealthLevel
  factors: { label: string; impact: 'positive' | 'negative' | 'neutral' }[]
}

export async function getClientHealth(clientId: string, agencyId: string): Promise<ClientHealth> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [overdueInvoices, recentComms, activeProject, feedback] = await Promise.all([
    prisma.invoice.count({ where: { clientId, status: 'vencido' } }),
    prisma.communication.count({ where: { clientId, client: { agencyId }, date: { gte: thirtyDaysAgo } } }),
    prisma.project.findFirst({ where: { clientId, completionPercentage: { lt: 100 } }, select: { completionPercentage: true } }),
    prisma.projectFeedback.findFirst({ where: { project: { clientId } }, orderBy: { createdAt: 'desc' }, select: { rating: true } }),
  ])

  let score = 70 // base score
  const factors: ClientHealth['factors'] = []

  // Overdue invoices: -20 per overdue
  if (overdueInvoices > 0) {
    score -= overdueInvoices * 20
    factors.push({ label: `${overdueInvoices} overdue invoice(s)`, impact: 'negative' })
  } else {
    factors.push({ label: 'No overdue invoices', impact: 'positive' })
  }

  // Recent communication: +15 if any in last 30 days
  if (recentComms > 0) {
    score += 15
    factors.push({ label: 'Recent communication', impact: 'positive' })
  } else {
    score -= 10
    factors.push({ label: 'No communication in 30 days', impact: 'negative' })
  }

  // Active project progress
  if (activeProject) {
    if (activeProject.completionPercentage >= 50) {
      score += 10
      factors.push({ label: `Project ${activeProject.completionPercentage}% complete`, impact: 'positive' })
    } else {
      factors.push({ label: `Project ${activeProject.completionPercentage}% complete`, impact: 'neutral' })
    }
  }

  // Satisfaction rating
  if (feedback) {
    if (feedback.rating >= 4) { score += 10; factors.push({ label: `Rating: ${feedback.rating}/5`, impact: 'positive' }) }
    else if (feedback.rating <= 2) { score -= 15; factors.push({ label: `Rating: ${feedback.rating}/5`, impact: 'negative' }) }
    else { factors.push({ label: `Rating: ${feedback.rating}/5`, impact: 'neutral' }) }
  }

  score = Math.max(0, Math.min(100, score))
  const level: HealthLevel = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red'

  return { clientId, score, level, factors }
}

export async function getClientsHealthBatch(clientIds: string[], agencyId: string): Promise<Map<string, ClientHealth>> {
  const results = new Map<string, ClientHealth>()
  await Promise.all(clientIds.map(async (id) => {
    results.set(id, await getClientHealth(id, agencyId))
  }))
  return results
}
