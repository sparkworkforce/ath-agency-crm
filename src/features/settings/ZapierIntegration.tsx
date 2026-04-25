'use client'

import { ZAPIER_TRIGGERS, ZAPIER_ACTIONS } from '@/lib/zapier'

export default function ZapierIntegration({ webhookUrl, apiKey }: { webhookUrl: string | null; apiKey: string | null }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">⚡ Zapier / Make Integration</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Connect CobraHub to 5000+ apps via webhooks and the v1 API.</p>

      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Triggers (Webhooks → Zapier)</h4>
        <p className="text-[10px] text-gray-400 mb-2">Configure your webhook URL in the Integrations tab. Events are sent as POST with HMAC signature.</p>
        <div className="space-y-1">
          {ZAPIER_TRIGGERS.map(t => (
            <div key={t.key} className="flex items-center justify-between text-xs border-b border-gray-100 dark:border-gray-700 py-1.5">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{t.label}</span>
                <span className="text-gray-400 ml-2">{t.event}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${webhookUrl ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {webhookUrl ? 'Active' : 'No webhook'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Actions (Zapier → CobraHub)</h4>
        <p className="text-[10px] text-gray-400 mb-2">Use your API key with the v1 API endpoints. Requires Business plan.</p>
        <div className="space-y-1">
          {ZAPIER_ACTIONS.map(a => (
            <div key={a.key} className="flex items-center justify-between text-xs border-b border-gray-100 dark:border-gray-700 py-1.5">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{a.label}</span>
                <span className="text-gray-400 ml-2">{a.method} {a.endpoint}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${apiKey ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {apiKey ? 'Ready' : 'No API key'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
