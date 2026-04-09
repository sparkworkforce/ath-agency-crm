import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT' || !session.user.clientId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { projectId, rating, comment } = await request.json()
  if (!projectId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Verify project belongs to this client and is 100%
  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: session.user.clientId, completionPercentage: 100 },
    select: { id: true, feedback: true },
  })
  if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  if (project.feedback) return NextResponse.json({ error: 'Ya enviaste tu evaluación' }, { status: 409 })

  const feedback = await prisma.projectFeedback.create({
    data: { projectId, rating, comment: comment?.trim() || null },
  })

  return NextResponse.json({ feedback }, { status: 201 })
}
