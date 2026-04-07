import { prisma } from '../prisma'
import { uploadFile, BUCKETS } from '../storage'
import { resend } from '../resend'
import type { CreateProjectInput, UpdateTaskStatusInput, AssignTaskInput } from '../validations/projects'
import type { TaskStatus } from '../../../prisma/generated/prisma/client'

const DEFAULT_TASKS = [
  'Revisar plataforma del cliente y obtener accesos de administrador',
  'Crear y configurar cuenta ATH Business del cliente',
  'Integrar Payment Button API en el checkout',
  'Configurar webhooks y probar flujo completo de pago',
  'Entregar documentación y capacitar al cliente',
]

export async function createProject(data: CreateProjectInput) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { name: data.name, clientId: data.clientId, completionPercentage: 0 },
    })
    await tx.task.createMany({
      data: DEFAULT_TASKS.map((title, i) => ({
        projectId: project.id,
        title,
        order: i + 1,
        status: 'pendiente' as TaskStatus,
      })),
    })
    return project
  })
}

export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: { orderBy: { order: 'asc' } },
      files: { orderBy: { createdAt: 'desc' } },
      client: { select: { id: true, businessName: true, deletedAt: true } },
    },
  })
}

export async function listProjectsByClient(clientId: string) {
  return prisma.project.findMany({
    where: { clientId },
    include: { tasks: { select: { status: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function assignTask(taskId: string, data: AssignTaskInput) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      assignedToId: data.assignedToId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  })
}

export async function updateTaskStatus(taskId: string, data: UpdateTaskStatusInput) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: data.status },
  })
  await recalculateCompletionPercentage(task.projectId)
  return task
}

export async function recalculateCompletionPercentage(projectId: string): Promise<number> {
  const tasks = await prisma.task.findMany({ where: { projectId } })
  if (tasks.length === 0) return 0

  const completed = tasks.filter((t) => t.status === 'completado').length
  const percentage = Math.round((completed / tasks.length) * 100)

  await prisma.project.update({
    where: { id: projectId },
    data: { completionPercentage: percentage },
  })

  return percentage
}

export async function markOverdueTasks(): Promise<void> {
  await prisma.task.updateMany({
    where: {
      status: { in: ['pendiente', 'en_progreso'] },
      dueDate: { lt: new Date() },
    },
    data: { status: 'vencido' },
  })
}

export async function uploadProjectFile(
  projectId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileBuffer: Buffer,
  uploadedBy: string
) {
  const storageKey = `${projectId}/${Date.now()}-${fileName}`
  await uploadFile(BUCKETS.PROJECT_FILES, storageKey, fileBuffer, fileType)

  return prisma.projectFile.create({
    data: { projectId, fileName, fileType, fileSize, storageKey, uploadedBy },
  })
}

// ─── Portal Service ───────────────────────────────────────

export function assertClientOwnership(sessionClientId: string, resourceClientId: string): void {
  if (sessionClientId !== resourceClientId) {
    throw new Error('FORBIDDEN')
  }
}

export async function getClientActiveProject(clientId: string) {
  return prisma.project.findFirst({
    where: { clientId, client: { deletedAt: null } },
    include: { tasks: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function uploadClientFile(
  clientId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileBuffer: Buffer
) {
  const storageKey = `${clientId}/${Date.now()}-${fileName}`
  await uploadFile(BUCKETS.CLIENT_UPLOADS, storageKey, fileBuffer, fileType)

  // Notify assigned agency user
  const project = await prisma.project.findFirst({
    where: { clientId },
    include: {
      tasks: {
        where: { assignedToId: { not: null } },
        include: { assignedTo: { select: { email: true, name: true } } },
        take: 1,
      },
      client: { select: { businessName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const agencyUser = project?.tasks[0]?.assignedTo
  if (agencyUser?.email) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: agencyUser.email,
      subject: `Nuevo archivo subido — ${project?.client.businessName}`,
      html: `<p>El cliente <strong>${project?.client.businessName}</strong> ha subido un archivo: <strong>${fileName}</strong>.</p>`,
    })
  }

  return { storageKey, fileName }
}

export async function createSupportTicket(
  clientId: string,
  data: { title: string; description: string }
) {
  return prisma.supportTicket.create({
    data: { clientId, title: data.title, description: data.description, status: 'abierto' },
  })
}

export async function listSupportTickets(clientId: string) {
  return prisma.supportTicket.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  })
}
