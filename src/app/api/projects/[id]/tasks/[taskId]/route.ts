import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { UpdateTaskStatusSchema, AssignTaskSchema } from '@/lib/validations/projects'
import { updateTaskStatus, assignTask } from '@/lib/services/projects.service'
import { dispatchWebhook } from '@/lib/webhook'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { taskId } = await params
  const body = await request.json()

  const statusResult = UpdateTaskStatusSchema.safeParse(body)
  if (statusResult.success) {
    try {
      const task = await updateTaskStatus(taskId, statusResult.data, session.user.agencyId)
      if (statusResult.data.status === 'completado') {
        dispatchWebhook(session.user.agencyId, 'task.completed', { taskId, title: task.title })
      }
      return NextResponse.json({ task })
    } catch {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  }

  const assignResult = AssignTaskSchema.safeParse(body)
  if (assignResult.success) {
    try {
      const task = await assignTask(taskId, assignResult.data, session.user.agencyId)
      return NextResponse.json({ task })
    } catch {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
}
