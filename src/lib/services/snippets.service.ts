import { prisma } from '../prisma'
import type { CreateSnippetInput, SnippetSearchInput } from '../validations/snippets'

export async function searchSnippets(agencyId: string, query: SnippetSearchInput) {
  return prisma.codeSnippet.findMany({
    where: {
      agencyId,
      ...(query.platform ? { platform: query.platform } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
              { code: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { author: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createSnippet(data: CreateSnippetInput, authorId: string, agencyId: string) {
  return prisma.codeSnippet.create({
    data: { ...data, authorId, agencyId },
  })
}

export async function updateSnippet(
  snippetId: string,
  data: Partial<CreateSnippetInput>,
  agencyId: string
) {
  return prisma.codeSnippet.update({
    where: { id: snippetId, agencyId },
    data,
  })
}

export async function deleteSnippet(snippetId: string, agencyId: string) {
  return prisma.codeSnippet.delete({ where: { id: snippetId, agencyId } })
}
