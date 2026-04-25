import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { UpdateClientStatusSchema } from '@/lib/validations/clients'
import { updateClientStatus } from '@/lib/services/clients.service'
import { safeParseBody } from '@/lib/safe-parse-body'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const { id } = await params
  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const result = UpdateClientStatusSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  try {
    const client = await updateClientStatus(id, result.data.status, session.user.id, session.user.agencyId)
    return NextResponse.json({ client })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
