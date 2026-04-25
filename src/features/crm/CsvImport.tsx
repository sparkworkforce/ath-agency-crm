'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'

interface ParsedRow {
  businessName: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  platform: string
  status: string
}

const REQUIRED_COLS = ['businessName', 'contactName', 'contactEmail']
const COLUMN_MAP: Record<string, string> = {
  'business name': 'businessName', 'business': 'businessName', 'company': 'businessName', 'nombre': 'businessName', 'negocio': 'businessName',
  'contact name': 'contactName', 'contact': 'contactName', 'name': 'contactName', 'contacto': 'contactName',
  'email': 'contactEmail', 'contact email': 'contactEmail', 'correo': 'contactEmail',
  'phone': 'contactPhone', 'contact phone': 'contactPhone', 'telefono': 'contactPhone', 'teléfono': 'contactPhone',
  'platform': 'platform', 'plataforma': 'platform',
  'status': 'status', 'estado': 'status',
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const cells: string[] = []
    let current = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue }
      if (ch === ',' && !inQuote) { cells.push(current.trim()); current = ''; continue }
      current += ch
    }
    cells.push(current.trim())
    return cells
  })
  return { headers, rows }
}

function mapColumns(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {}
  headers.forEach((h, i) => {
    const key = COLUMN_MAP[h.toLowerCase()]
    if (key) mapping[i] = key
  })
  return mapping
}

export default function CsvImport({ onComplete }: { onComplete?: () => void }) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: { row: number; error: string }[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const { headers, rows: rawRows } = parseCsv(reader.result as string)
      const colMap = mapColumns(headers)
      const errs: string[] = []

      const missing = REQUIRED_COLS.filter(c => !Object.values(colMap).includes(c))
      if (missing.length > 0) { errs.push(`Missing columns: ${missing.join(', ')}`); setErrors(errs); return }

      const parsed: ParsedRow[] = rawRows.map((cells, i) => {
        const row: any = { platform: 'CUSTOM', status: 'prospecto' }
        Object.entries(colMap).forEach(([idx, key]) => { if (cells[Number(idx)]) row[key] = cells[Number(idx)] })
        if (!row.businessName || !row.contactName || !row.contactEmail) errs.push(`Row ${i + 1}: missing required fields`)
        return row
      }).filter(r => r.businessName && r.contactName && r.contactEmail)

      setRows(parsed)
      setErrors(errs)
      setResult(null)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch('/api/clients/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
        toast.success(`${data.imported} client(s) imported`)
        onComplete?.()
      } else { toast.error('Import failed') }
    } catch { toast.error('Import failed') }
    setImporting(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Import Clients from CSV</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Upload a CSV with columns: businessName, contactName, contactEmail, platform (optional), status (optional)
      </p>

      <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>Choose CSV File</Button>

      {errors.length > 0 && (
        <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
          {errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
        </div>
      )}

      {rows.length > 0 && !result && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{rows.length} row(s) ready to import</p>
          <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded text-xs">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-2 py-1 text-left text-gray-500">Business</th>
                  <th className="px-2 py-1 text-left text-gray-500">Contact</th>
                  <th className="px-2 py-1 text-left text-gray-500">Email</th>
                  <th className="px-2 py-1 text-left text-gray-500">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-300">{r.businessName}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-300">{r.contactName}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-300">{r.contactEmail}</td>
                    <td className="px-2 py-1 text-gray-700 dark:text-gray-300">{r.platform}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && <p className="text-center text-gray-400 py-1">...and {rows.length - 20} more</p>}
          </div>
          <div className="mt-2">
            <Button size="sm" onClick={handleImport} loading={importing}>Import {rows.length} Client(s)</Button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-3 text-xs">
          <p className="text-green-600 font-medium">{result.imported} imported successfully</p>
          {result.errors.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {result.errors.map((e, i) => <p key={i} className="text-red-500">Row {e.row + 1}: {e.error}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
