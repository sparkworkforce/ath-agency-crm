import { NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { getDashboardMetrics } from '@/lib/services/dashboard.service'

export async function GET() {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  try {
    const metrics = await getDashboardMetrics(session.user.agencyId)
    return NextResponse.json(metrics)
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
