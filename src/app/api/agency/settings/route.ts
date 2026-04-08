import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { UpdateAgencySchema } from '@/lib/validations/agency'

export async function PATCH(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const body = await request.json()
  const result = UpdateAgencySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const agency = await prisma.agency.update({
      where: { id: session.user.agencyId },
      data: result.data,
    })
    return NextResponse.json({ agency })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
