import { prisma } from './prisma'
import { createHmac } from 'crypto'
import { resolve4, resolve6 } from 'dns/promises'
import { redis } from './rate-limit'

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

function isPrivateIP(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip === '::1') return true
  // IPv6 private ranges
  const lower = ip.toLowerCase()
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // fc00::/7
  if (lower.startsWith('fe80')) return true // fe80::/10 link-local
  if (lower === '::' || lower === '::1') return true
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4) return false
  if (parts[0] === 10) return true
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
  if (parts[0] === 192 && parts[1] === 168) return true
  if (parts[0] === 169 && parts[1] === 254) return true // link-local
  return false
}

export async function dispatchWebhook(
  agencyId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<DeliveryResult> {
  // Deduplication: skip if same event+data dispatched within 5 minutes
  const dedupKey = `wh:dedup:${createHmac('sha256', event).update(JSON.stringify(data)).digest('hex')}`
  if (redis) {
    const seen = await redis.get(dedupKey)
    if (seen) return { success: true }
  }

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

    // DNS resolution check — resolve hostname and verify IP is not private
    try {
      const ips = await resolve4(parsed.hostname)
      if (ips.some(isPrivateIP)) {
        return { success: false, error: 'Webhook URL resolves to a private IP address' }
      }
      // Also check IPv6
      try {
        const ipv6s = await resolve6(parsed.hostname)
        if (ipv6s.some(isPrivateIP)) {
          return { success: false, error: 'Webhook URL resolves to a private IPv6 address' }
        }
      } catch { /* No AAAA records is fine */ }
    } catch {
      return { success: false, error: 'Could not resolve webhook hostname' }
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
        redirect: 'manual',
      })

      const result: DeliveryResult = { success: res.ok, statusCode: res.status }

      // Log delivery
      await logDelivery({ agencyId, event, url: agency.webhookUrl, payload, statusCode: res.status, success: res.ok, attempt: attempt + 1 })

      if (res.ok) {
        if (redis) await redis.set(dedupKey, '1', { ex: 300 })
        return result
      }
      if (attempt === 0) { await new Promise(r => setTimeout(r, 2000)); continue }
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
