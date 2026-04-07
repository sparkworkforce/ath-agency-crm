import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateAgencyUserSchema } from '@/lib/validations/clients'
import { createAgencyUser, listAgencyUsers } from '@/lib/services/users.service'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const users = await listAgencyUsers()
  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const result = CreateAgencyUserSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: result.error.flatten() }, { status: 400 })
  }

  try {
    const user = await createAgencyUser(result.data)
    const { password: _, ...safeUser } = user as any
    return NextResponse.json({ user: safeUser }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'EMAIL_ALREADY_EXISTS') {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
