'use client'

interface ExportButtonProps {
  type: 'clients' | 'invoices' | 'revenue'
  label?: string
}

export default function ExportButton({ type, label = 'Exportar CSV' }: ExportButtonProps) {
  return (
    <a
      href={`/api/export?type=${type}`}
      download
      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
    >
      {label}
    </a>
  )
}
