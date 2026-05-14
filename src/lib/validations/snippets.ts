import { z } from 'zod'

export const CreateSnippetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  code: z.string().min(1).max(10000),
  language: z.string().min(1).max(50),
  platform: z.enum(['WOOCOMMERCE', 'SHOPIFY', 'CUSTOM', 'GENERAL']),
  category: z.enum(['wrapper', 'webhook', 'utility']),
})

export const SnippetSearchSchema = z.object({
  q: z.string().max(200).optional(),
  platform: z.enum(['WOOCOMMERCE', 'SHOPIFY', 'CUSTOM', 'GENERAL']).optional(),
  category: z.enum(['wrapper', 'webhook', 'utility']).optional(),
})

export type CreateSnippetInput = z.infer<typeof CreateSnippetSchema>
export type SnippetSearchInput = z.infer<typeof SnippetSearchSchema>
