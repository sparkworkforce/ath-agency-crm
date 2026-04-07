import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.email({ error: 'Email inválido' }),
  password: z.string().min(8, { error: 'La contraseña debe tener al menos 8 caracteres' }),
})

export const InviteClientSchema = z.object({
  clientId: z.string().cuid({ error: 'ID de cliente inválido' }),
  email: z.email({ error: 'Email inválido' }),
  name: z.string().min(1, { error: 'El nombre es requerido' }).max(100),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type InviteClientInput = z.infer<typeof InviteClientSchema>
