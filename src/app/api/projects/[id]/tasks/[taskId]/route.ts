import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UpdateTaskStatusSchema, AssignTaskSchema } from '@/lib/validations/projects'
import { updateTaskStatus, assignTask } from '@/lib/services/projects.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { taskId } = await params
  const body = await request.json()

  const statusResult = UpdateTaskStatusSchema.safeParse(body)
  if (statusResult.success) {
    try {
      const task = await updateTaskStatus(taskId, statusResult.data)
      return NextResponse.json({ task })
    } catch {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  }

  const assignResult = AssignTaskSchema.safeParse(body)
  if (assignResult.success) {
    try {
      const task = await assignTask(taskId, assignResult.data)
      return NextResponse.json({ task })
    } catch {
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
}
