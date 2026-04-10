import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const notifications = await prisma.notification.findMany({ where: { userId: session.user.id, read: false }, orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json({ notifications })
}

const MarkReadSchema = z.object({ ids: z.array(z.string().min(1)) })

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const result = MarkReadSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  await prisma.notification.updateMany({ where: { id: { in: result.data.ids }, userId: session.user.id }, data: { read: true } })
  return NextResponse.json({ ok: true })
}
