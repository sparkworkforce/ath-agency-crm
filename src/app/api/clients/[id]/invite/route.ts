import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { InviteClientUserSchema } from '@/lib/validations/clients'
import { inviteClientUser } from '@/lib/services/clients.service'
import { prisma } from '@/lib/prisma'
import { safeParseBody } from '@/lib/safe-parse-body'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await rateLimit(request)
  if (blocked) return blocked

  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = InviteClientUserSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const agency = await prisma.agency.findUnique({
      where: { id: session.user.agencyId },
      select: { name: true, logoUrl: true, primaryColor: true },
    })
    await inviteClientUser(id, result.data.email, result.data.name, session.user.agencyId, agency ?? undefined)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'CLIENT_NOT_FOUND') {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }
    if (err.message === 'EMAIL_ALREADY_EXISTS') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
