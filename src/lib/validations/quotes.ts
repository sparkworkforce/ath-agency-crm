import { z } from 'zod'

export const CreateQuoteSchema = z.object({
  clientId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  validUntil: z.string().datetime().nullable().optional(),
  lines: z.array(z.object({
    description: z.string().min(1).max(500),
    amount: z.number().positive(),
  })).min(1),
})

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>
