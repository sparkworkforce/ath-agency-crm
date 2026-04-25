import { prisma } from '../prisma'

interface Estimation {
  predictedDays: number
  confidence: 'high' | 'medium' | 'low'
  predictedDate: Date
  velocityPerDay: number
  atRisk: boolean
  reason?: string
}

export async function estimateProjectCompletion(projectId: string, agencyId: string): Promise<Estimation | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { agencyId } },
    include: {
      tasks: { select: { status: true, estimatedDays: true, createdAt: true, updatedAt: true } },
      client: { select: { platform: true } },
    },
  })
  if (!project) return null

  const totalTasks = project.tasks.length
  if (totalTasks === 0) return null

  const completed = project.tasks.filter(t => t.status === 'completado')
  const remaining = totalTasks - completed.length

  if (remaining === 0) {
    return { predictedDays: 0, confidence: 'high', predictedDate: new Date(), velocityPerDay: 0, atRisk: false }
  }

  // Calculate velocity from completed tasks
  const projectAge = Math.max(1, (Date.now() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  const velocityPerDay = completed.length / projectAge

  // Get historical data for this platform
  const historicalProjects = await prisma.project.findMany({
    where: { client: { agencyId, platform: project.client.platform }, completionPercentage: 100 },
    select: { createdAt: true, updatedAt: true, tasks: { select: { id: true } } },
    take: 20,
  })

  let predictedDays: number
  let confidence: 'high' | 'medium' | 'low'

  if (historicalProjects.length >= 5) {
    // Use historical average adjusted by current velocity
    const avgHistoricalDays = historicalProjects.reduce((sum, p) => {
      return sum + (p.updatedAt.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    }, 0) / historicalProjects.length

    const remainingRatio = remaining / totalTasks
    predictedDays = Math.round(avgHistoricalDays * remainingRatio)
    confidence = historicalProjects.length >= 10 ? 'high' : 'medium'
  } else if (velocityPerDay > 0) {
    // Use current velocity
    predictedDays = Math.round(remaining / velocityPerDay)
    confidence = 'low'
  } else {
    // Use estimated days from tasks
    const remainingDays = project.tasks.filter(t => t.status !== 'completado').reduce((sum, t) => sum + (t.estimatedDays ?? 3), 0)
    predictedDays = remainingDays
    confidence = 'low'
  }

  const predictedDate = new Date(Date.now() + predictedDays * 24 * 60 * 60 * 1000)
  const estimatedDate = project.estimatedCompletionDate
  const atRisk = estimatedDate ? predictedDate > estimatedDate : false
  const reason = atRisk ? `Predicted ${Math.round((predictedDate.getTime() - estimatedDate!.getTime()) / (1000 * 60 * 60 * 24))} days behind schedule` : undefined

  return { predictedDays, confidence, predictedDate, velocityPerDay: Math.round(velocityPerDay * 100) / 100, atRisk, reason }
}
