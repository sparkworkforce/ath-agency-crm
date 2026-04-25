import { z } from 'zod'

const TaskItemSchema = z.object({
  title: z.string().min(1).max(200),
  estimatedHours: z.number().nonnegative().optional(),
})

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  platform: z.enum(['WOOCOMMERCE', 'SHOPIFY', 'CUSTOM', 'GENERAL']),
  tasks: z.array(TaskItemSchema).min(1).max(100),
  isPublic: z.boolean().default(false),
})

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>
