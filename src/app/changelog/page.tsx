import Link from 'next/link'

const RELEASES = [
  {
    version: '1.2.0',
    date: '2026-04-08',
    title: 'Crecimiento y Expansión',
    items: [
      '🔌 Soporte multi-procesador: ATH Business, ATH Móvil, PayPal, Stripe Connect, Square, Mercado Pago',
      '🔑 API pública v1 para agencias con plan Business',
      '🤝 Programa de referidos — invita agencias y gana meses gratis',
      '📋 Página de changelog público',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-04-07',
    title: 'Portal y Retención',
    items: [
      '📊 Línea de tiempo visual (Gantt) en el portal del cliente',
      '📰 Feed de actividad reciente en el portal',
      '⭐ Encuesta de satisfacción al completar proyecto',
      '🔔 Notificaciones webhook (Slack, Discord, Zapier)',
      '📱 Integración WhatsApp para invitaciones y recordatorios',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-04-06',
    title: 'Lanzamiento Inicial',
    items: [
      '👥 CRM con pipeline de clientes (prospecto → soporte mensual)',
      '📋 Gestión de proyectos con tareas auto-generadas por plataforma',
      '💰 Facturación con IVU, PDF, pagos y retainers automáticos',
      '🔗 Portal del cliente con magic links y seguimiento en tiempo real',
      '📧 Emails de milestone al 25/50/75/100% de completitud',
      '📊 Dashboard con 7 KPIs y checklist de onboarding',
      '💳 Suscripciones Stripe (Gratis / Profesional / Business)',
      '📤 Exportación CSV de clientes, facturas e ingresos',
      '🔒 Verificación de email, reset de contraseña, rate limiting',
      '🧹 Retención de datos GDPR con purga automática',
      '🐍 Branding CobraHub con tema emerald',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">🐍 CobraHub</Link>
          <Link href="/register" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Comenzar gratis →</Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Changelog</h1>
        <p className="text-sm text-gray-500 mb-8">Todas las actualizaciones y mejoras de CobraHub.</p>
        <div className="space-y-10">
          {RELEASES.map((release) => (
            <article key={release.version} className="border-l-2 border-emerald-500 pl-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-emerald-100 text-emerald-700 text-xs font-mono font-bold px-2 py-0.5 rounded">v{release.version}</span>
                <time className="text-xs text-gray-400">{new Date(release.date).toLocaleDateString('es-PR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{release.title}</h2>
              <ul className="space-y-1.5">
                {release.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600">{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
