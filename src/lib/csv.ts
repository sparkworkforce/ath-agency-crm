const FORMULA_CHARS = new Set(['=', '+', '-', '@', '\t', '\r'])
function sanitizeCell(value: string): string {
  if (value.length > 0 && FORMULA_CHARS.has(value[0])) return "'" + value
  return value
}

export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${sanitizeCell(v).replace(/"/g, '""')}"`
  const lines = [headers.map(escape).join(',')]
  for (const row of rows) {
    lines.push(row.map(escape).join(','))
  }
  return lines.join('\n')
}

export function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
