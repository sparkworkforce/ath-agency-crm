import { prisma } from './prisma'
import { createHmac } from 'crypto'

type WebhookEvent = 'client.created' | 'task.completed' | 'payment.received' | 'file.uploaded' | 'project.milestone' | 'integration.health.failed'

export async function dispatchWebhook(agencyId: string, event: WebhookEvent, data: Record<string, unknown>) {
  const agency = await prisma.agency.findUnique({ where: { id: agencyId }, select: { webhookUrl: true, apiKey: true } })
  if (!agency?.webhookUrl) return

  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data })
  const signature = agency.apiKey ? createHmac('sha256', agency.apiKey).update(body).digest('hex') : ''

  await fetch(agency.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CobraHub-Event': event, 'X-CobraHub-Signature': signature },
    body,
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
}
