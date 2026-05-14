import { z } from 'zod'

export const CreateAgencyUserSchema = z.object({
  name: z.string().min(1, { error: 'El nombre es requerido' }).max(100),
  email: z.email({ error: 'Email inválido' }).max(254),
  password: z.string().min(8, { error: 'La contraseña debe tener al menos 8 caracteres' }).max(128),
})

export type CreateAgencyUserInput = z.infer<typeof CreateAgencyUserSchema>
