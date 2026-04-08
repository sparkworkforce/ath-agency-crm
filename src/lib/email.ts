import { resend } from './resend'

const BRAND_COLOR = '#059669' // emerald-600

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function emailTemplate(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb"><div style="max-width:560px;margin:0 auto;padding:40px 20px"><div style="text-align:center;margin-bottom:24px;font-size:18px;font-weight:700;color:#111827">🐍 CobraHub</div><div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:32px">${body}</div><div style="text-align:center;margin-top:24px;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} CobraHub. Todos los derechos reservados.</div></div></body></html>`
}

export function emailButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;font-size:14px">${label}</a>`
}

export async function sendEmail(to: string, subject: string, body: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    html: emailTemplate(body),
  })
}
