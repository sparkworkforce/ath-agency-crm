import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { getRevenueAnalytics } from '@/lib/services/analytics.service'

export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const data = await getRevenueAnalytics(session.user.agencyId)
  return NextResponse.json(data)
}
