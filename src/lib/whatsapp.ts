const WHATSAPP_API = 'https://graph.facebook.com/v21.0'

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

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const config = getConfig()
  if (!config) return false

  const phone = to.replace(/[^0-9]/g, '')
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
  } catch {
    return false
  }
}

export async function sendWhatsAppTemplate(to: string, templateName: string, params: string[]): Promise<boolean> {
  const config = getConfig()
  if (!config) return false

  const phone = to.replace(/[^0-9]/g, '')
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
  } catch {
    return false
  }
}

export function whatsappLink(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9+]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
