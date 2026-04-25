import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, esc } from '@/lib/email'
import { getEffectivePlan } from '@/lib/plan-gating'
import { verifyCronAuth } from '@/lib/cron-auth'

export async function GET(request: NextRequest) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const agencies = await prisma.agency.findMany({
    select: { id: true, name: true, logoUrl: true, primaryColor: true, plan: true, trialEndsAt: true, stripeSubId: true },
  })

  let sent = 0
  for (const agency of agencies) {
    if (getEffectivePlan(agency) === 'FREE') continue

    const [newClients, revenue, overdueInvoices, completedProjects, users] = await Promise.all([
      prisma.client.count({ where: { agencyId: agency.id, deletedAt: null, createdAt: { gte: weekAgo } } }),
      prisma.payment.aggregate({ where: { invoice: { client: { agencyId: agency.id } }, createdAt: { gte: weekAgo } }, _sum: { amount: true } }),
      prisma.invoice.count({ where: { client: { agencyId: agency.id }, status: 'vencido' } }),
      prisma.project.count({ where: { client: { agencyId: agency.id }, completionPercentage: 100, updatedAt: { gte: weekAgo } } }),
      prisma.user.findMany({ where: { agencyId: agency.id, active: true, role: 'AGENCY' }, select: { email: true } }),
    ])

    const collected = Number(revenue._sum.amount ?? 0)
    const branding = { name: agency.name, logoUrl: agency.logoUrl, primaryColor: agency.primaryColor }

    const body = `
      <h2 style="font-size:16px;margin:0 0 16px">Weekly Report — ${esc(agency.name)}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">New clients</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${newClients}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">Revenue collected</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#059669">$${collected.toFixed(2)}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb">Overdue invoices</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;${overdueInvoices > 0 ? 'color:#dc2626' : ''}">${overdueInvoices}</td></tr>
        <tr><td style="padding:8px 0">Projects completed</td><td style="padding:8px 0;text-align:right;font-weight:600">${completedProjects}</td></tr>
      </table>
      <p style="margin-top:16px;font-size:13px;color:#6b7280">Week of ${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
    `

    for (const user of users) {
      try {
        await sendEmail(user.email, `Weekly Report — ${agency.name}`, body, branding)
        sent++
      } catch { /* continue on email failure */ }
    }
  }

  return NextResponse.json({ sent })
}
