import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { checkPlanLimit } from '@/lib/plan-gating'
import { CreateAgencyUserSchema } from '@/lib/validations/users'
import { createAgencyUser, listAgencyUsers } from '@/lib/services/users.service'
import { safeParseBody } from '@/lib/safe-parse-body'

export async function GET() {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const users = await listAgencyUsers(session.user.agencyId)
  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const [session, authError] = await requireAgencyAuth()
  if (authError) return authError

  const [body, parseError] = await safeParseBody(request)
  if (parseError) return parseError
  const allowed = await checkPlanLimit(session.user.agencyId, 'users')
  if (!allowed) return NextResponse.json({ error: 'Límite de usuarios alcanzado. Actualiza tu plan.' }, { status: 403 })

  const result = CreateAgencyUserSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  try {
    const user = await createAgencyUser(result.data, session.user.agencyId)
    const { password: _, ...safeUser } = user as any
    return NextResponse.json({ user: safeUser }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'EMAIL_ALREADY_EXISTS') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
