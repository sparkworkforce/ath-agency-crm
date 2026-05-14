import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { CreateProjectSchema } from '@/lib/validations/projects'
import { createProject } from '@/lib/services/projects.service'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'X-API-Key, Content-Type', 'API-Version': '1' }

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [agency, error] = await requireApiKey(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50))
  const skip = (page - 1) * limit

  const where = { client: { agencyId: agency.id, deletedAt: null } }
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: { id: true, name: true, completionPercentage: true, estimatedCompletionDate: true, createdAt: true, client: { select: { id: true, businessName: true } }, tasks: { select: { id: true, title: true, status: true, order: true }, orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({ projects, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, { headers: corsHeaders })
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
    return NextResponse.json({ project }, { status: 201, headers: corsHeaders })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
