import { z } from 'zod'

export const CreateInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  totalAmount: z.number().positive({ error: 'El monto debe ser mayor a 0' }),
  dueDate: z.string().datetime(),
  isRetainer: z.boolean().default(false),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    amount: z.number().positive(),
  })).min(1, { error: 'Se requiere al menos un ítem' }),
})

export const RecordPaymentSchema = z.object({
  amount: z.number().positive({ error: 'El monto debe ser mayor a 0' }),
  receivedAt: z.string().datetime(),
  method: z.string().optional(),
})

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>
