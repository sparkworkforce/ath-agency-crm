import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { CreateSnippetSchema } from '@/lib/validations/snippets'
import { updateSnippet, deleteSnippet } from '@/lib/services/snippets.service'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const result = CreateSnippetSchema.partial().safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    const snippet = await updateSnippet(id, result.data)
    return NextResponse.json({ snippet })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  try {
    await deleteSnippet(id)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
