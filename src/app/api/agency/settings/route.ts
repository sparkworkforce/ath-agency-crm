import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { UpdateAgencySchema } from '@/lib/validations/agency'
import { safeParseBody } from '@/lib/safe-parse-body'

export async function PATCH(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = UpdateAgencySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Custom domain requires Business plan
  if (result.data.customDomain !== undefined) {
    const agency = await prisma.agency.findUnique({ where: { id: session.user.agencyId }, select: { plan: true } })
    if (agency?.plan !== 'BUSINESS') {
      return NextResponse.json({ error: 'Custom domain requires Business plan' }, { status: 403 })
    }
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
