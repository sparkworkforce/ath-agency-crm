import { prisma } from './prisma'
import { createHmac } from 'crypto'

export type WebhookEvent =
  | 'client.created' | 'client.status_changed'
  | 'invoice.created' | 'invoice.paid'
  | 'project.completed' | 'project.milestone'
  | 'task.completed'
  | 'payment.received'

interface DeliveryResult {
  success: boolean
  statusCode?: number
  error?: string
}

// Log delivery attempt — uses dynamic access to avoid TS error if model doesn't exist yet
async function logDelivery(data: Record<string, unknown>) {
  try {
    await (prisma as any).webhookDelivery?.create({ data })
  } catch {}
}

export async function dispatchWebhook(
  agencyId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<DeliveryResult> {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { webhookUrl: true, apiKey: true },
  })
  if (!agency?.webhookUrl) return { success: false, error: 'No webhook URL configured' }

  // SSRF protection: block private/internal URLs
  try {
    const parsed = new URL(agency.webhookUrl)
    if (parsed.protocol !== 'https:') return { success: false, error: 'Webhook URL must use HTTPS' }
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0' ||
        host.endsWith('.local') || host.endsWith('.internal') ||
        host.startsWith('10.') || host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
      return { success: false, error: 'Webhook URL cannot target private networks' }
    }
  } catch {
    return { success: false, error: 'Invalid webhook URL' }
  }

  const payload = JSON.stringify({ event, timestamp: new Date().toISOString(), data })
  const signature = agency.apiKey
    ? createHmac('sha256', agency.apiKey).update(payload).digest('hex')
    : ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CobraHub-Event': event,
    'X-CobraHub-Signature': signature,
  }

  // Attempt delivery with 1 retry
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(agency.webhookUrl, {
        method: 'POST',
        headers,
        body: payload,
        signal: AbortSignal.timeout(10000),
      })

      const result: DeliveryResult = { success: res.ok, statusCode: res.status }

      // Log delivery
      await logDelivery({ agencyId, event, url: agency.webhookUrl, payload, statusCode: res.status, success: res.ok, attempt: attempt + 1 })

      if (res.ok) return result
      if (attempt === 0) continue // retry once
      return result
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      if (attempt === 1) {
        await logDelivery({ agencyId, event, url: agency.webhookUrl, payload, statusCode: 0, success: false, attempt: 2, error })
        return { success: false, error }
      }
    }
  }
  return { success: false, error: 'Max retries exceeded' }
}
