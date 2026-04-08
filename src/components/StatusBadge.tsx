interface StatusBadgeProps {
  status: string
  variant: 'client' | 'task' | 'invoice' | 'ticket'
}

const CLIENT_COLORS: Record<string, string> = {
  prospecto: 'bg-gray-100 text-gray-700',
  en_progreso: 'bg-emerald-100 text-emerald-700',
  completado: 'bg-green-100 text-green-700',
  soporte_mensual: 'bg-purple-100 text-purple-700',
}

const TASK_COLORS: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-700',
  en_progreso: 'bg-emerald-100 text-emerald-700',
  completado: 'bg-green-100 text-green-700',
  vencido: 'bg-red-100 text-red-700',
}

const INVOICE_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  pagado: 'bg-green-100 text-green-700',
  vencido: 'bg-red-100 text-red-700',
}

const TICKET_COLORS: Record<string, string> = {
  abierto: 'bg-emerald-100 text-emerald-700',
  en_progreso: 'bg-yellow-100 text-yellow-700',
  cerrado: 'bg-gray-100 text-gray-700',
}

const COLOR_MAP = {
  client: CLIENT_COLORS,
  task: TASK_COLORS,
  invoice: INVOICE_COLORS,
  ticket: TICKET_COLORS,
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const colors = COLOR_MAP[variant]
  const colorClass = colors[status] ?? 'bg-gray-100 text-gray-700'

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
      data-testid={`status-badge-${variant}-${status}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
