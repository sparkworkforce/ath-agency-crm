import type { WebhookEvent } from './webhook'

export interface ZapierTrigger {
  key: string
  event: WebhookEvent
  label: string
  description: string
  sampleData: Record<string, unknown>
}

export interface ZapierAction {
  key: string
  endpoint: string
  method: string
  label: string
  description: string
  fields: { key: string; label: string; type: string; required: boolean }[]
}

export const ZAPIER_TRIGGERS: ZapierTrigger[] = [
  { key: 'client_created', event: 'client.created', label: 'New Client', description: 'Triggers when a new client is created', sampleData: { id: 'abc123', businessName: 'Acme Corp', contactEmail: 'john@acme.com', platform: 'WOOCOMMERCE', status: 'prospecto' } },
  { key: 'invoice_paid', event: 'invoice.paid', label: 'Invoice Paid', description: 'Triggers when an invoice is fully paid', sampleData: { id: 'inv123', totalAmount: 1500, status: 'pagado', clientName: 'Acme Corp' } },
  { key: 'project_completed', event: 'project.completed', label: 'Project Completed', description: 'Triggers when a project reaches 100%', sampleData: { id: 'proj123', name: 'ATH Integration', completionPercentage: 100, clientName: 'Acme Corp' } },
  { key: 'client_status_changed', event: 'client.status_changed', label: 'Client Status Changed', description: 'Triggers when a client pipeline status changes', sampleData: { id: 'abc123', businessName: 'Acme Corp', oldStatus: 'prospecto', newStatus: 'en_progreso' } },
  { key: 'payment_received', event: 'payment.received', label: 'Payment Received', description: 'Triggers when a payment is recorded', sampleData: { id: 'pay123', amount: 500, invoiceId: 'inv123', clientName: 'Acme Corp' } },
  { key: 'task_completed', event: 'task.completed', label: 'Task Completed', description: 'Triggers when a project task is completed', sampleData: { id: 'task123', title: 'Configure webhooks', projectName: 'ATH Integration' } },
]

export const ZAPIER_ACTIONS: ZapierAction[] = [
  { key: 'create_client', endpoint: '/api/v1/clients', method: 'POST', label: 'Create Client', description: 'Creates a new client', fields: [
    { key: 'businessName', label: 'Business Name', type: 'string', required: true },
    { key: 'contactName', label: 'Contact Name', type: 'string', required: true },
    { key: 'contactEmail', label: 'Contact Email', type: 'string', required: true },
    { key: 'platform', label: 'Platform', type: 'string', required: true },
  ]},
  { key: 'create_invoice', endpoint: '/api/v1/invoices', method: 'POST', label: 'Create Invoice', description: 'Creates a new invoice', fields: [
    { key: 'clientId', label: 'Client ID', type: 'string', required: true },
    { key: 'totalAmount', label: 'Total Amount', type: 'number', required: true },
    { key: 'dueDate', label: 'Due Date', type: 'datetime', required: true },
  ]},
  { key: 'create_project', endpoint: '/api/v1/projects', method: 'POST', label: 'Create Project', description: 'Creates a new project', fields: [
    { key: 'name', label: 'Project Name', type: 'string', required: true },
    { key: 'clientId', label: 'Client ID', type: 'string', required: true },
  ]},
]
