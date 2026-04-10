import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { taskId } = await params

  const task = await prisma.task.findFirst({
    where: { id: taskId, status: 'completado', project: { clientId: session.user.clientId } },
  })
  if (!task) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { approvedByClient: true, approvedAt: new Date() },
  })

  return NextResponse.json({ task: updated })
}
