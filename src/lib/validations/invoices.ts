import { z } from 'zod'

export const CreateInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  totalAmount: z.number().positive({ error: 'El monto debe ser mayor a 0' }),
  dueDate: z.string().datetime(),
  isRetainer: z.boolean().default(false),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(500),
    amount: z.number().positive(),
  })).min(1, { error: 'Se requiere al menos un ítem' }),
})

export const RecordPaymentSchema = z.object({
  amount: z.number().positive({ error: 'El monto debe ser mayor a 0' }),
  receivedAt: z.string().datetime(),
  method: z.string().max(100).optional(),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>

export const UpdateInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(500),
    amount: z.number().positive(),
  })).min(1).optional(),
})

export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>
