import { logger } from '@/lib/logger'

const WHATSAPP_API = 'https://graph.facebook.com/v21.0'
const CONVERSATION_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
}

function getConfig(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !accessToken) return null
  return { phoneNumberId, accessToken }
}

/** Check if within 24h conversation window */
function isWithinWindow(lastInboundAt: Date | null | undefined): boolean {
  if (!lastInboundAt) return false
  return Date.now() - new Date(lastInboundAt).getTime() < CONVERSATION_WINDOW_MS
}

/**
 * Send a WhatsApp text message. Only allowed within 24h of last inbound message.
 * @param hasConsent - caller must verify opt-in before calling
 * @param lastInboundAt - timestamp of last message received from this user
 */
export async function sendWhatsAppMessage(to: string, message: string, hasConsent = false, lastInboundAt?: Date | null): Promise<boolean> {
  const config = getConfig()
  if (!config) return false

  const phone = to.replace(/[^0-9]/g, '')

  if (!hasConsent) {
    logger.error('WhatsApp message blocked: no opt-in consent', { to: phone })
    return false
  }

  if (!isWithinWindow(lastInboundAt)) {
    logger.error('WhatsApp message blocked: outside 24h conversation window. Use template instead.', { to: phone })
    return false
  }

  try {
    const res = await fetch(`${WHATSAPP_API}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
      signal: AbortSignal.timeout(10000),
    })
    return res.ok
  } catch (e) {
    logger.error('WhatsApp message failed', { to: phone, error: (e as Error).message })
    return false
  }
}

/**
 * Send a WhatsApp template message. Allowed outside 24h window (pre-approved by Meta).
 * @param hasConsent - caller must verify opt-in before calling
 */
export async function sendWhatsAppTemplate(to: string, templateName: string, params: string[], hasConsent = false): Promise<boolean> {
  const config = getConfig()
  if (!config) return false

  const phone = to.replace(/[^0-9]/g, '')

  if (!hasConsent) {
    logger.error('WhatsApp template blocked: no opt-in consent', { to: phone, template: templateName })
    return false
  }

  try {
    const res = await fetch(`${WHATSAPP_API}/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es' },
          components: params.length > 0 ? [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: p })) }] : undefined,
        },
      }),
      signal: AbortSignal.timeout(10000),
    })
    return res.ok
  } catch (e) {
    logger.error('WhatsApp template failed', { to: phone, template: templateName, error: (e as Error).message })
    return false
  }
}

export function whatsappLink(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9+]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
