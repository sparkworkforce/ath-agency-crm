import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runIntegrationHealthChecks } from '@/lib/services/health-monitor.service'
import { dispatchWebhook, type WebhookEvent } from '@/lib/webhook'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

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
      await dispatchWebhook(agency.id, 'integration.health.failed' as WebhookEvent, {
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
