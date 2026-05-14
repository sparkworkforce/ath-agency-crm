import { NextRequest, NextResponse } from 'next/server'
import { requireAgencyAuth } from '@/lib/tenant'
import { safeParseBody } from '@/lib/safe-parse-body'

export async function POST(request: NextRequest) {
  const [, authError] = await requireAgencyAuth()
  if (authError) return authError
  const [body, parseError] = await safeParseBody<{ subject?: string; html?: string; mergeData?: Record<string, string> }>(request)
  if (parseError) return parseError
  const { subject = '', html = '', mergeData = {} } = body ?? {}
  let rendered = html
  for (const [key, value] of Object.entries(mergeData)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value)
  }
  return NextResponse.json({ subject, html: rendered })
}
