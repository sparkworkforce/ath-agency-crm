import { NextResponse } from 'next/server'

export async function safeParseBody<T = unknown>(request: Request): Promise<[T, null] | [null, NextResponse]> {
  try {
    const body = await request.json()
    return [body as T, null]
  } catch {
    return [null, NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })]
  }
}
