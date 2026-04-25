import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getDashboardMetrics } from '@/lib/services/dashboard.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.agencyId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const agencyId = session.user.agencyId
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      async function sendMetrics() {
        try {
          const metrics = await getDashboardMetrics(agencyId)
          const data = JSON.stringify({
            activeClientsCount: metrics.activeClientsCount,
            projectsInProgressCount: metrics.projectsInProgressCount,
            monthlyRevenue: metrics.monthlyRevenue,
            overdueTasksCount: metrics.overdueTasksCount,
            mrr: metrics.mrr,
            collectionRate: metrics.collectionRate,
          })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          controller.enqueue(encoder.encode(`data: {}\n\n`))
        }
      }

      await sendMetrics()
      const interval = setInterval(sendMetrics, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
