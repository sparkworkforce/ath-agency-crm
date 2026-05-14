import { NextResponse } from 'next/server'

const MAX_BODY_SIZE = 1_048_576 // 1MB

export async function safeParseBody<T = unknown>(request: Request): Promise<[T, null] | [null, NextResponse]> {
  try {
    const text = await request.text()
    if (text.length > MAX_BODY_SIZE) {
      return [null, NextResponse.json({ error: 'Request body too large' }, { status: 413 })]
    }
    const body = JSON.parse(text)
    return [body as T, null]
  } catch {
    return [null, NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })]
  }
}
