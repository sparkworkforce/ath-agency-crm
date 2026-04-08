import { z } from 'zod'

export const RegisterAgencySchema = z.object({
  agencyName: z.string().min(2, { error: 'El nombre de la agencia debe tener al menos 2 caracteres' }).max(100),
  name: z.string().min(1, { error: 'Tu nombre es requerido' }).max(100),
  email: z.email({ error: 'Email inválido' }),
  password: z.string().min(8, { error: 'La contraseña debe tener al menos 8 caracteres' }),
})

export const UpdateAgencySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export type RegisterAgencyInput = z.infer<typeof RegisterAgencySchema>
export type UpdateAgencyInput = z.infer<typeof UpdateAgencySchema>
