import { z } from 'zod'

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.preprocess((v) => (v === null || v === '' ? undefined : v), z.coerce.number().int().min(1).max(100).default(20)),
})

export type PaginationInput = z.infer<typeof PaginationSchema>

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function paginationArgs(input: PaginationInput) {
  return { skip: (input.page - 1) * input.limit, take: input.limit }
}

export function paginated<T>(data: T[], total: number, input: PaginationInput): PaginatedResult<T> {
  return { data, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) }
}
