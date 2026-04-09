interface IntegrationData {
  accountStatus: string
  publicToken?: string | null
  environment: string
  webhookUrl?: string | null
  webhookVerified: boolean
  testTransactionOk?: boolean | null
  goLiveAt?: Date | string | null
}

export function computeGoLiveScore(integration: IntegrationData | null): { score: number; checks: { label: string; done: boolean; points: number }[] } {
  if (!integration) return { score: 0, checks: [] }

  const checks = [
    { label: 'Cuenta activa', done: integration.accountStatus === 'active' || integration.accountStatus === 'approved', points: 20 },
    { label: 'Token configurado', done: !!integration.publicToken, points: 15 },
    { label: 'Webhook URL', done: !!integration.webhookUrl, points: 15 },
    { label: 'Webhook verificado', done: integration.webhookVerified, points: 20 },
    { label: 'Transacción de prueba', done: integration.testTransactionOk === true, points: 20 },
    { label: 'Producción', done: integration.environment === 'production', points: 10 },
  ]

  const score = checks.reduce((sum, c) => sum + (c.done ? c.points : 0), 0)
  return { score, checks }
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}
