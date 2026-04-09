import { prisma } from '../prisma'
import tls from 'tls'

interface HealthResult {
  integrationId: string
  projectId: string
  webhookOk: boolean | null
  sslDaysRemaining: number | null
  sslOk: boolean | null
  checkedAt: Date
}

/** Check webhook URL responds with 2xx */
async function checkWebhook(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) })
    return res.ok
  } catch {
    return false
  }
}

/** Check SSL cert expiry via TLS socket. Returns days until expiry, or -1 on error. */
function checkSSLExpiry(hostname: string): Promise<number> {
  return new Promise((resolve) => {
    const socket = tls.connect(443, hostname, { servername: hostname, timeout: 10000 }, () => {
      const cert = socket.getPeerCertificate()
      socket.destroy()
      if (!cert?.valid_to) return resolve(-1)
      const expiryMs = new Date(cert.valid_to).getTime() - Date.now()
      resolve(Math.floor(expiryMs / 86400000))
    })
    socket.on('error', () => { socket.destroy(); resolve(-1) })
    socket.on('timeout', () => { socket.destroy(); resolve(-1) })
  })
}

/** Run health checks on all live integrations */
export async function runIntegrationHealthChecks(): Promise<HealthResult[]> {
  const liveIntegrations = await prisma.integrationStatus.findMany({
    where: { environment: 'production', goLiveAt: { not: null } },
    select: { id: true, projectId: true, webhookUrl: true },
  })

  const results: HealthResult[] = []

  for (const integration of liveIntegrations) {
    const webhookOk = integration.webhookUrl ? await checkWebhook(integration.webhookUrl) : null
    let sslDaysRemaining: number | null = null
    let sslOk: boolean | null = null

    if (integration.webhookUrl?.startsWith('https')) {
      const hostname = new URL(integration.webhookUrl).hostname
      sslDaysRemaining = await checkSSLExpiry(hostname)
      sslOk = sslDaysRemaining > 7 // Warn if expiring within 7 days
    }

    results.push({ integrationId: integration.id, projectId: integration.projectId, webhookOk, sslDaysRemaining, sslOk, checkedAt: new Date() })
  }

  return results
}
