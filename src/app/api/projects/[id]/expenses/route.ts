import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().datetime(),
  category: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, client: { agencyId: session.user.agencyId } }, select: { id: true } })
  if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const expenses = await prisma.expense.findMany({ where: { projectId: id }, orderBy: { date: 'desc' } })
  return NextResponse.json({ expenses })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError
  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, client: { agencyId: session.user.agencyId } }, select: { id: true } })
  if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  const body = await req.json()
  const result = CreateExpenseSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  const expense = await prisma.expense.create({
    data: { projectId: id, description: result.data.description, amount: result.data.amount, date: new Date(result.data.date), category: result.data.category ?? 'general', createdBy: session.user.id },
  })
  return NextResponse.json({ expense }, { status: 201 })
}
