export const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'CobraHub API',
    version: '1.0.0',
    description: 'Public API for CobraHub agency management platform. Requires Business plan.',
  },
  servers: [{ url: '/api/v1' }],
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: { type: 'apiKey' as const, in: 'header' as const, name: 'X-API-Key' },
    },
    schemas: {
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          businessName: { type: 'string' },
          contactName: { type: 'string' },
          contactEmail: { type: 'string', format: 'email' },
          platform: { type: 'string' },
          status: { type: 'string', enum: ['prospecto', 'en_progreso', 'completado', 'soporte_mensual'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          completionPercentage: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          status: { type: 'string', enum: ['pendiente', 'en_progreso', 'completado', 'vencido'] },
        },
      },
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          totalAmount: { type: 'number' },
          status: { type: 'string', enum: ['borrador', 'pendiente', 'pagado', 'vencido'] },
          dueDate: { type: 'string', format: 'date-time' },
          isRetainer: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/clients': {
      get: {
        summary: 'List all clients',
        operationId: 'listClients',
        responses: {
          '200': {
            description: 'Client list',
            content: { 'application/json': { schema: { type: 'object', properties: { clients: { type: 'array', items: { $ref: '#/components/schemas/Client' } } } } } },
          },
          '401': { description: 'Invalid or missing API key' },
        },
      },
      post: {
        summary: 'Create a client',
        operationId: 'createClient',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['businessName', 'contactName', 'contactEmail', 'platform'], properties: { businessName: { type: 'string' }, contactName: { type: 'string' }, contactEmail: { type: 'string', format: 'email' }, contactPhone: { type: 'string' }, platform: { type: 'string' }, notes: { type: 'string' } } } } },
        },
        responses: {
          '201': { description: 'Client created', content: { 'application/json': { schema: { type: 'object', properties: { client: { $ref: '#/components/schemas/Client' } } } } } },
          '400': { description: 'Validation failed' },
          '401': { description: 'Invalid or missing API key' },
        },
      },
    },
    '/projects': {
      get: {
        summary: 'List all projects',
        operationId: 'listProjects',
        responses: {
          '200': {
            description: 'Project list',
            content: { 'application/json': { schema: { type: 'object', properties: { projects: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } } },
          },
          '401': { description: 'Invalid or missing API key' },
        },
      },
      post: {
        summary: 'Create a project',
        operationId: 'createProject',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name', 'clientId'], properties: { name: { type: 'string' }, clientId: { type: 'string' }, estimatedCompletionDate: { type: 'string', format: 'date-time' } } } } },
        },
        responses: {
          '201': { description: 'Project created', content: { 'application/json': { schema: { type: 'object', properties: { project: { $ref: '#/components/schemas/Project' } } } } } },
          '400': { description: 'Validation failed' },
          '401': { description: 'Invalid or missing API key' },
        },
      },
    },
    '/invoices': {
      get: {
        summary: 'List all invoices',
        operationId: 'listInvoices',
        responses: {
          '200': {
            description: 'Invoice list',
            content: { 'application/json': { schema: { type: 'object', properties: { invoices: { type: 'array', items: { $ref: '#/components/schemas/Invoice' } } } } } },
          },
          '401': { description: 'Invalid or missing API key' },
        },
      },
      post: {
        summary: 'Create an invoice',
        operationId: 'createInvoice',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['clientId', 'lineItems', 'dueDate'], properties: { clientId: { type: 'string' }, lineItems: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, amount: { type: 'number' } } } }, dueDate: { type: 'string', format: 'date-time' }, notes: { type: 'string' } } } } },
        },
        responses: {
          '201': { description: 'Invoice created', content: { 'application/json': { schema: { type: 'object', properties: { invoice: { $ref: '#/components/schemas/Invoice' } } } } } },
          '400': { description: 'Validation failed' },
          '401': { description: 'Invalid or missing API key' },
        },
      },
    },
  },
}
