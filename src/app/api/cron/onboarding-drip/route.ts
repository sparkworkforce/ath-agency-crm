import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, esc, emailButton } from '@/lib/email'
import { verifyCronAuth } from '@/lib/cron-auth'

const DRIP_SCHEDULE = [
  { day: 0, subject: 'Welcome to {{agency}}!', template: 'welcome' },
  { day: 3, subject: 'What to expect — {{agency}}', template: 'expectations' },
  { day: 7, subject: 'How\'s everything going? — {{agency}}', template: 'checkin' },
]

function getDripBody(template: string, vars: { clientName: string; agencyName: string; portalUrl: string }): string {
  switch (template) {
    case 'welcome':
      return `<p>Hi ${esc(vars.clientName)},</p><p>Welcome! We're excited to work with you. Your client portal is ready:</p>${emailButton(vars.portalUrl, 'Access Your Portal')}<p>You can track project progress, upload files, and open support tickets anytime.</p><p>— ${esc(vars.agencyName)}</p>`
    case 'expectations':
      return `<p>Hi ${esc(vars.clientName)},</p><p>Here's what to expect over the coming weeks:</p><ol style="padding-left:20px"><li>We'll set up your ATH Business integration</li><li>You'll see tasks update in real-time in your portal</li><li>We'll notify you at each milestone (25%, 50%, 75%, 100%)</li></ol><p>Questions? Reply to this email or open a ticket in your portal.</p><p>— ${esc(vars.agencyName)}</p>`
    case 'checkin':
      return `<p>Hi ${esc(vars.clientName)},</p><p>It's been a week since we started. How's everything going?</p><p>If you have any questions or need anything, don't hesitate to reach out.</p>${emailButton(vars.portalUrl, 'Open Portal')}<p>— ${esc(vars.agencyName)}</p>`
    default:
      return ''
  }
}

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  const now = new Date()
  let sent = 0

  for (const drip of DRIP_SCHEDULE) {
    const targetDate = new Date(now.getTime() - drip.day * 86400000)
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const dayEnd = new Date(dayStart.getTime() + 86400000)

    const clients = await prisma.client.findMany({
      where: { createdAt: { gte: dayStart, lt: dayEnd }, deletedAt: null, status: { not: 'soporte_mensual' } },
      include: { agency: { select: { id: true, name: true, logoUrl: true, primaryColor: true, plan: true } } },
    })

    for (const client of clients) {
      if (client.agency.plan === 'FREE') continue

      // Deduplication: skip if drip already sent for this step
      const alreadySent = await prisma.communication.findFirst({
        where: { clientId: client.id, channel: 'drip', summary: { contains: drip.template } },
      })
      if (alreadySent) continue

      const subject = drip.subject.replace('{{agency}}', client.agency.name)
      const portalUrl = `${process.env.NEXTAUTH_URL}/portal`
      const body = getDripBody(drip.template, { clientName: client.contactName, agencyName: client.agency.name, portalUrl })
      const branding = { name: client.agency.name, logoUrl: client.agency.logoUrl, primaryColor: client.agency.primaryColor }

      try {
        await sendEmail(client.contactEmail, subject, body, branding)
        await prisma.communication.create({
          data: { clientId: client.id, channel: 'drip', summary: `drip:${drip.template}`, date: now, createdBy: 'system' },
        })
        sent++
      } catch {}
    }
  }

  return NextResponse.json({ sent })
}
