import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

const FEATURE_KEYS = ['golive', 'crm', 'projects', 'invoicing', 'portal', 'dashboard'] as const
const FEATURE_ICONS = { crm: '👥', projects: '📋', invoicing: '💰', portal: '🔗', dashboard: '📊', golive: '🚀' }

const PLAN_KEYS = ['free', 'pro', 'business'] as const
const PLAN_FEATURES: Record<string, number> = { free: 5, pro: 6, business: 5 }

export default async function RootPage() {
  const session = await auth()
  if (session?.user?.role === 'CLIENT') redirect('/portal')
  if (session?.user?.role === 'AGENCY') redirect('/dashboard')

  const t = await getTranslations('landing')

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">🐍 CobraHub</span>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">{t('nav.features')}</a>
            <a href="#pricing" className="hover:text-gray-900">{t('nav.pricing')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">{t('login')}</Link>
            <Link href="/register" className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700">{t('createAccount')}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          {t('heroBadge')}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight whitespace-pre-line">
          {t('heroTitle')}
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          {t('heroSub')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="bg-emerald-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-emerald-700">{t('ctaBenefit')}</Link>
          <Link href="/demo" className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-6 py-3 rounded-md">{t('demo')}</Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">{t('heroNote')}</p>
        <p className="mt-3 inline-block text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">{t('socialProof')}</p>
        {/* Dashboard Mockup */}
        <div className="mt-12 mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {/* Browser chrome */}
          <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center gap-1.5 px-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <span className="ml-3 text-[10px] text-gray-400 bg-gray-200 rounded px-2 py-0.5">cobrahub.io/dashboard</span>
          </div>
          <div className="flex">
            {/* Sidebar mock */}
            <div className="w-36 border-r border-gray-100 bg-gray-50 p-3 hidden sm:block">
              <p className="text-[10px] font-bold text-gray-800 mb-3">🐍 CobraHub</p>
              {['Dashboard', 'Clientes', 'Proyectos', 'Facturas', 'Snippets'].map((n, i) => (
                <div key={n} className={`text-[10px] px-2 py-1 rounded mb-0.5 ${i === 0 ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-500'}`}>{n}</div>
              ))}
            </div>
            {/* Main content mock */}
            <div className="flex-1 p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-800">Dashboard</p>
              {/* KPI cards */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Clientes', val: '12', color: 'text-emerald-600' },
                  { label: 'Proyectos', val: '8', color: 'text-indigo-600' },
                  { label: 'Revenue', val: '$4,250', color: 'text-green-600' },
                  { label: 'Vencidas', val: '2', color: 'text-red-500' },
                ].map(c => (
                  <div key={c.label} className="bg-gray-50 rounded p-2">
                    <p className="text-[8px] text-gray-400">{c.label}</p>
                    <p className={`text-xs font-bold ${c.color}`}>{c.val}</p>
                  </div>
                ))}
              </div>
              {/* Chart mock */}
              <div className="bg-gray-50 rounded p-2 h-24 flex items-end gap-1">
                {[35, 50, 40, 65, 55, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-emerald-400 rounded-t opacity-70" style={{ height: `${h}%` }} />
                ))}
              </div>
              {/* Table mock */}
              <div className="bg-gray-50 rounded p-2 space-y-1">
                {['Café Luna — En progreso', 'TechShop PR — Completado', 'Isla Fitness — Prospecto'].map(r => (
                  <div key={r} className="flex items-center justify-between text-[9px]">
                    <span className="text-gray-600">{r.split(' — ')[0]}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${r.includes('Completado') ? 'bg-green-100 text-green-700' : r.includes('progreso') ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.split(' — ')[1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center mb-10">
            <div><p className="text-2xl font-bold text-gray-900">{t('metricsAgencies')}</p></div>
            <div><p className="text-2xl font-bold text-gray-900">{t('metricsProcessed')}</p></div>
            <div><p className="text-2xl font-bold text-gray-900">{t('metricsUptime')}</p></div>
          </div>
          <p className="text-xs text-gray-400 text-center mb-6 uppercase tracking-wider">{t('integrations')}</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 font-medium">
            <span>🛒 WooCommerce</span>
            <span>🛍️ Shopify</span>
            <span>🏦 ATH Business</span>
            <span>💳 Stripe</span>
            <span>📧 Resend</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('howItWorksTitle')}</h2>
          <p className="text-sm text-gray-500 mb-12">{t('howItWorksSub')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '1️⃣', title: t('step1Title'), desc: t('step1Desc') },
              { icon: '2️⃣', title: t('step2Title'), desc: t('step2Desc') },
              { icon: '3️⃣', title: t('step3Title'), desc: t('step3Desc') },
            ].map((s) => (
              <div key={s.title}>
                <span className="text-3xl">{s.icon}</span>
                <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{t('featuresTitle')}</h2>
          <p className="text-sm text-gray-500 text-center mb-12">{t('featuresSub')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURE_KEYS.map((key) => (
              <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
                <span className="text-2xl">{FEATURE_ICONS[key]}</span>
                <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1">{t(`features.${key}.title`)}</h3>
                <p className="text-sm text-gray-500">{t(`features.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{t('pricingTitle')}</h2>
          <p className="text-sm text-gray-500 text-center mb-12">{t('pricingSub')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLAN_KEYS.map((key) => {
              const highlight = key === 'pro'
              return (
              <div key={key} className={`rounded-lg border p-6 ${highlight ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-gray-200'}`}>
                {highlight && <span className="text-xs font-medium text-emerald-600 mb-2 block">{t('popular')}</span>}
                <h3 className="text-sm font-semibold text-gray-900">{t(`plans.${key}.name`)}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900">{t(`plans.${key}.price`)}</span>
                  <span className="text-sm text-gray-500">{t(`plans.${key}.period`)}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{t(`plans.${key}.clients`)}</p>
                <p className="text-sm text-gray-600 mb-4">{t(`plans.${key}.users`)}</p>
                <ul className="space-y-2 mb-6">
                  {Array.from({ length: PLAN_FEATURES[key] }, (_, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> {t(`plans.${key}.f${i + 1}`)}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-2 px-4 rounded-md text-sm font-medium ${highlight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {t(`plans.${key}.cta`)}
                </Link>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t('comparisonTitle')}</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">{t('compare.feature')}</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">{t('plans.free.name')}</th>
                  <th className="text-center px-4 py-3 font-medium text-emerald-600">{t('plans.pro.name')}</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">{t('plans.business.name')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(['crm', 'invoicing', 'portal', 'dashboard', 'csv', 'branding', 'reminders', 'api'] as const).map((key) => (
                  <tr key={key}>
                    <td className="px-4 py-2.5 text-gray-700">{t(`compare.${key}`)}</td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{t(`compare.${key}_free`)}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{t(`compare.${key}_pro`)}</td>
                    <td className="px-4 py-2.5 text-center text-gray-500">{t(`compare.${key}_biz`)}</td>
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
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t('faqTitle')}</h2>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <details key={n} className="group border border-gray-200 rounded-lg">
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50">
                  {t(`faq.q${n}`)}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-sm text-gray-500 px-4 pb-3">{t(`faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} CobraHub. {t('footer')}</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-600">{t('terms')}</Link>
            <Link href="/privacy" className="hover:text-gray-600">{t('privacy')}</Link>
            <Link href="/changelog" className="hover:text-gray-600">{t('changelog')}</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
