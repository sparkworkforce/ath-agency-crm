import { prisma } from '../prisma'
import { sendEmail, emailButton, esc } from '../email'
import { generateMagicLinkToken } from './auth.service'
import { uploadFile, BUCKETS } from '../storage'
import type { CreateProjectInput, UpdateTaskStatusInput, AssignTaskInput } from '../validations/projects'
import { PROJECT_TEMPLATES, DEFAULT_TASKS, getEstimatedDays } from '../project-templates'
import { paginationArgs, paginated, type PaginationInput, type PaginatedResult } from '../pagination'
import type { TaskStatus } from '../../../prisma/generated/prisma/client'

export async function createProject(data: CreateProjectInput, agencyId: string) {
  // Look up client platform for template selection + verify ownership
  const client = await prisma.client.findFirst({ where: { id: data.clientId, agencyId, deletedAt: null }, select: { platform: true } })
  if (!client) throw new Error('CLIENT_NOT_FOUND')
  const tasks = PROJECT_TEMPLATES[client?.platform ?? 'CUSTOM'] ?? DEFAULT_TASKS
  const totalDays = getEstimatedDays(client?.platform ?? 'CUSTOM')
  const estimatedCompletionDate = new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000)

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { name: data.name, clientId: data.clientId, completionPercentage: 0, estimatedCompletionDate },
    })
    await tx.task.createMany({
      data: tasks.map((t, i) => ({
        projectId: project.id,
        title: t.title,
        estimatedDays: t.estimatedDays,
        order: i + 1,
        status: 'pendiente' as TaskStatus,
      })),
    })
    return project
  })
}

export async function getProjectById(projectId: string, agencyId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, client: { agencyId } },
    include: {
      tasks: { orderBy: { order: 'asc' } },
      files: { orderBy: { createdAt: 'desc' } },
      client: { select: { id: true, businessName: true, deletedAt: true } },
      integrationStatus: true,
    },
  })
}

export async function listAllProjects(agencyId: string, pagination?: undefined): Promise<any[]>
export async function listAllProjects(agencyId: string, pagination: PaginationInput): Promise<PaginatedResult<any>>
export async function listAllProjects(agencyId: string, pagination?: PaginationInput) {
  const where = { client: { agencyId, deletedAt: null } }
  const include = { client: { select: { id: true, businessName: true } }, tasks: { select: { status: true } } }

  if (!pagination) {
    return prisma.project.findMany({ where, include, orderBy: { createdAt: 'desc' } })
  }

  const [data, total] = await Promise.all([
    prisma.project.findMany({ where, include, orderBy: { createdAt: 'desc' }, ...paginationArgs(pagination) }),
    prisma.project.count({ where }),
  ])
  return paginated(data, total, pagination)
}

export async function listProjectsByClient(clientId: string, agencyId: string) {
  return prisma.project.findMany({
    where: { clientId, client: { agencyId } },
    include: { tasks: { select: { status: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function assignTask(taskId: string, data: AssignTaskInput, agencyId: string) {
  if (data.assignedToId) {
    const user = await prisma.user.findFirst({ where: { id: data.assignedToId, agencyId, active: true } })
    if (!user) throw new Error('USER_NOT_FOUND')
  }
  return prisma.task.update({
    where: { id: taskId, project: { client: { agencyId } } },
    data: {
      assignedToId: data.assignedToId,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  })
}

export async function updateTaskStatus(taskId: string, data: UpdateTaskStatusInput, agencyId: string) {
  const task = await prisma.task.update({
    where: { id: taskId, project: { client: { agencyId } } },
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

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { completionPercentage: percentage },
    select: { id: true, milestonesSent: true, completionPercentage: true, name: true, client: { select: { contactName: true, contactEmail: true, users: { select: { id: true }, take: 1 }, agency: { select: { name: true } } } } },
  })

  // Send milestone email at 25/50/75/100% (only once per milestone)
  const milestones = [25, 50, 75, 100]
  const sent = (project.milestonesSent as number[]) ?? []
  if (milestones.includes(percentage) && !sent.includes(percentage)) {
    const clientUser = project.client.users[0]
    if (clientUser) {
      await prisma.project.update({ where: { id: projectId }, data: { milestonesSent: [...sent, percentage] } })
      sendMilestoneEmail(project.client.contactEmail, project.client.contactName, project.name, percentage, clientUser.id, project.client.agency.name).catch(() => {})
    }
  }

  return percentage
}

export async function markOverdueTasks(): Promise<void> {
  // Find tasks that will be marked overdue, get their project IDs
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: { in: ['pendiente', 'en_progreso'] },
      dueDate: { lt: new Date() },
    },
    select: { projectId: true },
    distinct: ['projectId'],
  })

  await prisma.task.updateMany({
    where: {
      status: { in: ['pendiente', 'en_progreso'] },
      dueDate: { lt: new Date() },
    },
    data: { status: 'vencido' },
  })

  // Recalculate completion % for affected projects
  for (const { projectId } of overdueTasks) {
    await recalculateCompletionPercentage(projectId)
  }
}

export async function uploadProjectFile(
  projectId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileBuffer: Buffer,
  uploadedBy: string,
  agencyId: string
) {
  const project = await prisma.project.findFirst({ where: { id: projectId, client: { agencyId } } })
  if (!project) throw new Error('PROJECT_NOT_FOUND')

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
    await sendEmail(agencyUser.email, `Nuevo archivo subido — ${esc(project?.client.businessName ?? '')}`,
      `<p>El cliente <strong>${esc(project?.client.businessName ?? '')}</strong> ha subido un archivo: <strong>${esc(fileName)}</strong>.</p>`
    )
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
    where: { clientId },  // Client ownership verified by caller
    orderBy: { createdAt: 'desc' },
  })
}

async function sendMilestoneEmail(email: string, name: string, projectName: string, percentage: number, userId: string, agencyName: string) {
  const token = await generateMagicLinkToken(userId)
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const portalUrl = `${baseUrl}/api/auth/magic-link?token=${token}`

  const messages: Record<number, string> = {
    25: '¡Tu proyecto va por buen camino! Ya completamos el 25% de las tareas.',
    50: '¡Estamos a mitad de camino! El 50% de tu proyecto está completado.',
    75: '¡Casi listo! El 75% de tu proyecto está completado.',
    100: '🎉 ¡Tu proyecto está completado al 100%! Todas las tareas han sido finalizadas.',
  }

  await sendEmail(email, `${projectName} — ${percentage}% completado`,
    `<p>Hola ${esc(name)},</p><p>${messages[percentage]}</p><p><strong>Proyecto:</strong> ${esc(projectName)}</p><p>${emailButton(portalUrl, 'Ver progreso en el portal')}</p><p style="color:#6b7280">— ${esc(agencyName)}</p>`
  )
}
