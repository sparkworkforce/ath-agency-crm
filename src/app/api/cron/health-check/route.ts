import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runIntegrationHealthChecks } from '@/lib/services/health-monitor.service'
import { dispatchWebhook } from '@/lib/webhook'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const results = await runIntegrationHealthChecks()
  const failures = results.filter(r => r.webhookOk === false || r.sslOk === false)

  // Notify agencies with failing integrations
  for (const fail of failures) {
    const integration = await prisma.integrationStatus.findUnique({
      where: { id: fail.integrationId },
      include: { project: { include: { client: { select: { agencyId: true, businessName: true } } } } },
    })
    if (!integration) continue

    const agency = await prisma.agency.findUnique({ where: { id: integration.project.client.agencyId }, select: { id: true } })
    if (agency) {
      await dispatchWebhook(agency.id, 'integration.health.failed', {
        projectId: fail.projectId,
        client: integration.project.client.businessName,
        webhookOk: fail.webhookOk,
        sslOk: fail.sslOk,
        sslDaysRemaining: fail.sslDaysRemaining,
      })
    }
  }

  console.log(JSON.stringify({ level: 'info', msg: 'Health check complete', total: results.length, failures: failures.length, timestamp: new Date().toISOString() }))

  return NextResponse.json({ total: results.length, failures: failures.length, results })
}
