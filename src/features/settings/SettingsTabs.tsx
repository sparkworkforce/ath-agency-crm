'use client'

import { useState } from 'react'
import AgencySettings from './AgencySettings'
import BillingDashboard from './BillingDashboard'
import WebhookSettings from './WebhookSettings'
import CustomFieldsEditor from './CustomFieldsEditor'
import EmailTemplateBuilder from './EmailTemplateBuilder'
import TwoFactorSetup from './TwoFactorSetup'
import AuditLogViewer from './AuditLogViewer'

interface Props {
  agencyProps: any
  billingProps: any
  webhookUrl: string | null
}

const GROUPS = [
  { label: 'CUENTA', tabs: [{ key: 'general', label: 'General' }, { key: 'billing', label: 'Billing' }] },
  { label: 'INTEGRACIONES', tabs: [{ key: 'integrations', label: 'Webhooks & API' }, { key: 'templates', label: 'Templates' }] },
  { label: 'AVANZADO', tabs: [{ key: 'security', label: 'Security' }, { key: 'audit', label: 'Audit Log' }] },
]

export default function SettingsTabs({ agencyProps, billingProps, webhookUrl }: Props) {
  const [active, setActive] = useState('general')

  const content: Record<string, React.ReactNode> = {
    general: <AgencySettings agency={agencyProps} />,
    billing: <BillingDashboard {...billingProps} />,
    integrations: <div className="space-y-4"><WebhookSettings webhookUrl={webhookUrl} /></div>,
    templates: <div className="space-y-4"><EmailTemplateBuilder /><CustomFieldsEditor /></div>,
    security: <TwoFactorSetup />,
    audit: <AuditLogViewer />,
  }

  return (
    <div>
      <div className="border-b border-gray-200 flex flex-wrap gap-x-4 gap-y-1" role="tablist">
        {GROUPS.map((group) => (
          <div key={group.label} className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</span>
            {group.tabs.map(t => (
              <button key={t.key} role="tab" aria-selected={t.key === active} onClick={() => setActive(t.key)} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${t.key === active ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">{content[active]}</div>
    </div>
  )
}
