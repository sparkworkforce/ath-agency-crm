import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { purgeExpiredClients } from '@/lib/services/retention.service'
import { markOverdueTasks } from '@/lib/services/projects.service'
import { checkAndUpdateOverdueInvoices } from '@/lib/services/invoicing.service'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    await Promise.all([
      markOverdueTasks(),
      checkAndUpdateOverdueInvoices(),
    ])

    const retentionResult = await purgeExpiredClients()

    // Clean up demo accounts older than 24h (Client + CodeSnippet cascade on Agency delete)
    const demoAgencies = await prisma.agency.findMany({ where: { slug: { startsWith: 'demo-' }, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, select: { id: true } })
    for (const ag of demoAgencies) {
      await prisma.user.deleteMany({ where: { agencyId: ag.id } })
      await prisma.agency.delete({ where: { id: ag.id } }).catch(() => {})
    }

    console.log(JSON.stringify({ level: 'info', msg: 'Daily cron job complete', ...retentionResult, demoPurged: demoAgencies.length, timestamp: new Date().toISOString() }))

    return NextResponse.json({ success: true, ...retentionResult, demoPurged: demoAgencies.length })
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'Daily cron job failed', error: String(err), timestamp: new Date().toISOString() }))
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
