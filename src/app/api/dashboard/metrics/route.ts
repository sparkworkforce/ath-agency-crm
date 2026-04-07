import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDashboardMetrics } from '@/lib/services/dashboard.service'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const metrics = await getDashboardMetrics()
    return NextResponse.json(metrics)
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
