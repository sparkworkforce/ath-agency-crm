import { z } from 'zod'

export const CreateClientSchema = z.object({
  businessName: z.string().min(1, { error: 'El nombre del negocio es requerido' }).max(200),
  contactName: z.string().min(1, { error: 'El nombre de contacto es requerido' }).max(100),
  contactEmail: z.email({ error: 'Email inválido' }).max(254),
  contactPhone: z.string().max(20).optional(),
  industry: z.string().max(100).optional(),
  platform: z.enum(['WOOCOMMERCE', 'SHOPIFY', 'CUSTOM']),
})

export const UpdateClientSchema = CreateClientSchema.partial()

export const UpdateClientStatusSchema = z.object({
  status: z.enum(['prospecto', 'en_progreso', 'completado', 'soporte_mensual']),
})

export const CreateCommunicationSchema = z.object({
  date: z.string().datetime(),
  channel: z.string().min(1).max(50),
  summary: z.string().min(1).max(1000),
})

export const InviteClientUserSchema = z.object({
  email: z.email({ error: 'Email inválido' }).max(254),
  name: z.string().min(1, { error: 'El nombre es requerido' }).max(100),
})


export type CreateClientInput = z.infer<typeof CreateClientSchema>
export type UpdateClientStatusInput = z.infer<typeof UpdateClientStatusSchema>
export type CreateCommunicationInput = z.infer<typeof CreateCommunicationSchema>
export type InviteClientUserInput = z.infer<typeof InviteClientUserSchema>
