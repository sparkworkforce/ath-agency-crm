import { z } from 'zod'

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido').max(200),
  clientId: z.string().cuid('ID de cliente inválido'),
})

export const UpdateTaskStatusSchema = z.object({
  status: z.enum(['pendiente', 'en_progreso', 'completado', 'vencido']),
})

export const AssignTaskSchema = z.object({
  assignedToId: z.string().cuid().nullable(),
  dueDate: z.string().datetime().nullable(),
})

export const CreateTicketSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200),
  description: z.string().min(1, 'La descripción es requerida').max(2000),
})

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/zip']
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>
export type AssignTaskInput = z.infer<typeof AssignTaskSchema>
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>
