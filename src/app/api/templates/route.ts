import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

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

  const { name, description, platform, tasks, isPublic } = await request.json()
  if (!name || !platform || !tasks?.length) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const template = await prisma.projectTemplate.create({
    data: { agencyId: session.user.agencyId, name, description, platform, tasks, isPublic: isPublic ?? false },
  })

  return NextResponse.json({ template }, { status: 201 })
}
