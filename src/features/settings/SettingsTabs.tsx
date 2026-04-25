'use client'

import { Tabs } from '@/components/ui'
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

export default function SettingsTabs({ agencyProps, billingProps, webhookUrl }: Props) {
  return (
    <Tabs tabs={[
      { key: 'general', label: 'General', content: <AgencySettings agency={agencyProps} /> },
      { key: 'billing', label: 'Billing', content: <BillingDashboard {...billingProps} /> },
      { key: 'integrations', label: 'Integrations', content: <div className="space-y-4"><WebhookSettings webhookUrl={webhookUrl} /></div> },
      { key: 'templates', label: 'Templates', content: <div className="space-y-4"><EmailTemplateBuilder /><CustomFieldsEditor /></div> },
      { key: 'security', label: 'Security', content: <TwoFactorSetup /> },
      { key: 'audit', label: 'Audit Log', content: <AuditLogViewer /> },
    ]} />
  )
}
