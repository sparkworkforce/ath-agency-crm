import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'

const features = [
  { icon: '👥', title: 'CRM de Clientes', desc: 'Pipeline completo: prospecto → en progreso → completado → soporte mensual. Historial de comunicaciones y documentos.' },
  { icon: '📋', title: 'Gestión de Proyectos', desc: 'Tareas automáticas por plataforma (WooCommerce, Shopify, custom). Progreso en tiempo real con estimados de entrega.' },
  { icon: '💰', title: 'Facturación Inteligente', desc: 'Facturas con IVU, PDFs profesionales, tracking de pagos, retainers automáticos y recordatorios de cobro.' },
  { icon: '🔗', title: 'Portal de Cliente', desc: 'Acceso seguro por magic link. Tus clientes ven progreso, suben archivos y abren tickets — con tu branding.' },
  { icon: '📊', title: 'Dashboard & KPIs', desc: '7 métricas clave: revenue, clientes activos, proyectos, tareas vencidas, revenue/cliente, tiempo promedio y pipeline.' },
  { icon: '🚀', title: 'Go-Live Checklist', desc: 'Checklist integrado para cada integración ATH Business: cuenta, API keys, webhooks, sandbox y producción.' },
]

const plans = [
  { name: 'Gratis', price: '$0', period: '/mes', clients: '3 clientes', users: '1 usuario', features: ['CRM básico', 'Gestión de proyectos', 'Facturación', 'Portal de cliente', 'Dashboard'], cta: 'Comenzar gratis', highlight: false },
  { name: 'Profesional', price: '$29', period: '/mes', clients: '25 clientes', users: '5 usuarios', features: ['Todo en Gratis', 'Exportar CSV', 'Branding del portal', 'Snippets de código (ilimitados)', 'Recordatorios de pago', 'Soporte prioritario'], cta: 'Comenzar prueba', highlight: true },
  { name: 'Business', price: '$79', period: '/mes', clients: 'Ilimitados', users: 'Ilimitados', features: ['Todo en Profesional', 'API access', 'Integraciones avanzadas', 'Onboarding dedicado', 'Soporte dedicado'], cta: 'Contactar ventas', highlight: false },
]

export default async function RootPage() {
  const session = await auth()
  if (session?.user?.role === 'CLIENT') redirect('/portal')
  if (session?.user?.role === 'AGENCY') redirect('/dashboard')

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">🐍 CobraHub</span>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Funciones</a>
            <a href="#pricing" className="hover:text-gray-900">Precios</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Iniciar sesión</Link>
            <Link href="/register" className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">Crear cuenta</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Diseñado para agencias en Puerto Rico 🇵🇷
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Gestiona tus integraciones<br />ATH Business como un pro
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          CobraHub es la plataforma todo-en-uno para agencias que integran ATH Business. CRM, proyectos, facturación y portal de cliente — conectado y automatizado.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="bg-emerald-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-emerald-700">Comenzar gratis</Link>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-6 py-3 rounded-md">Ver planes</a>
        </div>
        <p className="text-xs text-gray-400 mt-4">Sin tarjeta de crédito. Gratis para siempre hasta 3 clientes.</p>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Todo lo que necesitas para cobrar</h2>
          <p className="text-sm text-gray-500 text-center mb-12">Desde el primer contacto hasta el soporte mensual.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Planes simples y transparentes</h2>
          <p className="text-sm text-gray-500 text-center mb-12">Comienza gratis. Escala cuando crezcas.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-lg border p-6 ${plan.highlight ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-gray-200'}`}>
                {plan.highlight && <span className="text-xs font-medium text-emerald-600 mb-2 block">Más popular</span>}
                <h3 className="text-sm font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{plan.clients}</p>
                <p className="text-sm text-gray-600 mb-4">{plan.users}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-2 px-4 rounded-md text-sm font-medium ${plan.highlight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Comparación de planes</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Función</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Gratis</th>
                  <th className="text-center px-4 py-3 font-medium text-emerald-600">Pro</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Clientes', '3', '25', '∞'],
                  ['Usuarios', '1', '5', '∞'],
                  ['CRM & Pipeline', '✓', '✓', '✓'],
                  ['Proyectos & Tareas', '✓', '✓', '✓'],
                  ['Facturación & PDF', '✓', '✓', '✓'],
                  ['Portal de Cliente', '✓', '✓', '✓'],
                  ['Dashboard & KPIs', '✓', '✓', '✓'],
                  ['Exportar CSV', '—', '✓', '✓'],
                  ['Branding del Portal', '—', '✓', '✓'],
                  ['Snippets de Código', '10', '∞', '∞'],
                  ['Recordatorios de Pago', '—', '✓', '✓'],
                  ['API Access', '—', '—', '✓'],
                  ['Soporte Dedicado', '—', '—', '✓'],
                ].map(([feature, free, pro, biz]) => (
                  <tr key={feature}>
                    <td className="px-4 py-2.5 text-gray-700">{feature}</td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{free}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{pro}</td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{biz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-6">
            {[
              { q: '¿Necesito tarjeta de crédito para comenzar?', a: 'No. El plan Gratis es completamente gratis y no requiere tarjeta de crédito. Puedes gestionar hasta 3 clientes sin costo.' },
              { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes subir o bajar de plan cuando quieras desde la configuración de tu cuenta. Los cambios se aplican inmediatamente.' },
              { q: '¿Mis clientes necesitan crear cuenta?', a: 'No. Los clientes acceden al portal mediante un magic link que les envías por email. No necesitan contraseña ni crear cuenta.' },
              { q: '¿Qué pasa con mis datos si cancelo?', a: 'Tus datos se mantienen por 90 días después de cancelar. Puedes exportar todo a CSV antes de cancelar.' },
              { q: '¿Funciona con cualquier plataforma de e-commerce?', a: 'Sí. CobraHub tiene templates para WooCommerce, Shopify y plataformas custom. Las tareas se generan automáticamente según la plataforma del cliente.' },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{faq.q}</h3>
                <p className="text-sm text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} CobraHub. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-600">Términos</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privacidad</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
