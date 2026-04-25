import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

function verifyWidgetToken(projectId: string, token: string, apiKey: string): boolean {
  const expected = createHmac('sha256', apiKey).update(`widget:${projectId}`).digest('hex').slice(0, 32)
  return token === expected
}

export function generateWidgetToken(projectId: string, apiKey: string): string {
  return createHmac('sha256', apiKey).update(`widget:${projectId}`).digest('hex').slice(0, 32)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { agency: { select: { apiKey: true, name: true, primaryColor: true } } } },
      tasks: { select: { title: true, status: true, order: true }, orderBy: { order: 'asc' } },
    },
  })

  if (!project?.client.agency.apiKey || !verifyWidgetToken(id, token, project.client.agency.apiKey)) {
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
