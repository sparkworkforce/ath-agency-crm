import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

// GET — list time entries for current user (optional ?taskId= filter)
export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const taskId = request.nextUrl.searchParams.get('taskId')
  const entries = await prisma.timeEntry.findMany({
    where: { userId: session.user.id, ...(taskId ? { taskId } : {}), task: { project: { client: { agencyId: session.user.agencyId } } } },
    include: { task: { select: { title: true, project: { select: { name: true, client: { select: { businessName: true } } } } } } },
    orderBy: { startedAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ entries })
}

// POST — start timer or log manual entry
export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { taskId, minutes, note } = await request.json()
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

  // Verify task belongs to agency
  const task = await prisma.task.findFirst({ where: { id: taskId, project: { client: { agencyId: session.user.agencyId } } } })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // If minutes provided, create a completed entry. Otherwise start a timer.
  if (minutes) {
    const entry = await prisma.timeEntry.create({
      data: { taskId, userId: session.user.id, minutes, note, startedAt: new Date(Date.now() - minutes * 60000), stoppedAt: new Date() },
    })
    return NextResponse.json({ entry }, { status: 201 })
  }

  // Check for running timer
  const running = await prisma.timeEntry.findFirst({ where: { userId: session.user.id, stoppedAt: null } })
  if (running) return NextResponse.json({ error: 'Timer already running', entry: running }, { status: 409 })

  const entry = await prisma.timeEntry.create({ data: { taskId, userId: session.user.id } })
  return NextResponse.json({ entry }, { status: 201 })
}

// PATCH — stop running timer
export async function PATCH(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const running = await prisma.timeEntry.findFirst({ where: { userId: session.user.id, stoppedAt: null } })
  if (!running) return NextResponse.json({ error: 'No running timer' }, { status: 404 })

  const stoppedAt = new Date()
  const minutes = Math.round((stoppedAt.getTime() - running.startedAt.getTime()) / 60000)

  const entry = await prisma.timeEntry.update({
    where: { id: running.id },
    data: { stoppedAt, minutes },
  })
  return NextResponse.json({ entry })
}
