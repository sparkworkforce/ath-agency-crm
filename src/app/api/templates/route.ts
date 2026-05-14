import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { requireRoutePermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { CreateTemplateSchema } from '@/lib/validations/templates'
import { safeParseBody } from '@/lib/safe-parse-body'

// GET — browse public templates or own templates (?mine=true)
export async function GET(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const mine = request.nextUrl.searchParams.get('mine') === 'true'
  const platform = request.nextUrl.searchParams.get('platform')

  const templates = await prisma.projectTemplate.findMany({
    where: mine
      ? { agencyId: session.user.agencyId }
      : { isPublic: true, ...(platform ? { platform } : {}) },
    include: { agency: { select: { name: true } } },
    orderBy: mine ? { createdAt: 'desc' } : { downloads: 'desc' },
  })

  return NextResponse.json({ templates })
}

// POST — publish a template
export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const permError = requireRoutePermission(session.user.agencyRole, 'templates')
  if (permError) return permError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = CreateTemplateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  const { name, description, platform, tasks, isPublic } = result.data

  const template = await prisma.projectTemplate.create({
    data: { agencyId: session.user.agencyId, name, description, platform, tasks, isPublic },
  })

  return NextResponse.json({ template }, { status: 201 })
}
