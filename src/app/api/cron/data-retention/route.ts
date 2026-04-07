import { NextRequest, NextResponse } from 'next/server'
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
    // Run all daily maintenance jobs
    await Promise.all([
      markOverdueTasks(),
      checkAndUpdateOverdueInvoices(),
    ])

    const retentionResult = await purgeExpiredClients()

    console.log(JSON.stringify({
      level: 'info',
      msg: 'Daily cron job complete',
      ...retentionResult,
      timestamp: new Date().toISOString(),
    }))

    return NextResponse.json({ success: true, ...retentionResult })
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      msg: 'Daily cron job failed',
      error: String(err),
      timestamp: new Date().toISOString(),
    }))
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
