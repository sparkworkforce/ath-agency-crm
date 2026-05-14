import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac, timingSafeEqual } from 'crypto'
import { rateLimit } from '@/lib/rate-limit'

function verifyWidgetToken(projectId: string, token: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(`widget:${projectId}`).digest('hex').slice(0, 32)
  if (token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

export function generateWidgetToken(projectId: string, secret: string): string {
  return createHmac('sha256', secret).update(`widget:${projectId}`).digest('hex').slice(0, 32)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const { id } = await params
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { agency: { select: { widgetSecret: true, apiKey: true, name: true, primaryColor: true } } } },
      tasks: { select: { title: true, status: true, order: true }, orderBy: { order: 'asc' } },
    },
  })

  const secret = project?.client.agency.widgetSecret ?? project?.client.agency.apiKey
  if (!project || !secret || !verifyWidgetToken(id, token, secret)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  return NextResponse.json({
    name: project.name,
    completionPercentage: project.completionPercentage,
    tasks: project.tasks.map(t => ({ title: t.title, status: t.status })),
    agency: { name: project.client.agency.name, color: project.client.agency.primaryColor ?? '#059669' },
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
