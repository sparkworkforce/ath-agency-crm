import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

// POST — import a public template into own agency
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const source = await prisma.projectTemplate.findUnique({ where: { id } })
  if (!source || !source.isPublic) return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 })

  const [imported] = await prisma.$transaction([
    prisma.projectTemplate.create({
      data: { agencyId: session.user.agencyId, name: source.name, description: source.description, platform: source.platform, tasks: source.tasks as any },
    }),
    prisma.projectTemplate.update({ where: { id }, data: { downloads: { increment: 1 } } }),
  ])

  return NextResponse.json({ template: imported }, { status: 201 })
}
