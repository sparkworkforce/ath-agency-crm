import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { CreateProjectSchema } from '@/lib/validations/projects'
import { createProject } from '@/lib/services/projects.service'

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const projects = await prisma.project.findMany({
    where: { client: { agencyId: agency.id, deletedAt: null } },
    select: { id: true, name: true, completionPercentage: true, estimatedCompletionDate: true, createdAt: true, client: { select: { id: true, businessName: true } }, tasks: { select: { id: true, title: true, status: true, order: true }, orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ projects })
}

export async function POST(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError

  const result = CreateProjectSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })

  try {
    const project = await createProject(result.data, agency.id)
    return NextResponse.json({ project }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
