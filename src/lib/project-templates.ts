interface TaskTemplate {
  title: string
  estimatedDays: number
}

export const PROJECT_TEMPLATES: Record<string, TaskTemplate[]> = {
  WOOCOMMERCE: [
    { title: 'Revisar plataforma WooCommerce y obtener accesos de administrador', estimatedDays: 1 },
    { title: 'Crear y configurar cuenta ATH Business del cliente', estimatedDays: 2 },
    { title: 'Instalar y configurar plugin de payment gateway en WooCommerce', estimatedDays: 2 },
    { title: 'Integrar Payment Button API en el checkout de WooCommerce', estimatedDays: 3 },
    { title: 'Configurar webhooks y probar flujo completo de pago', estimatedDays: 2 },
    { title: 'Entregar documentación y capacitar al cliente', estimatedDays: 1 },
  ],
  SHOPIFY: [
    { title: 'Revisar tienda Shopify y obtener accesos de administrador', estimatedDays: 1 },
    { title: 'Crear y configurar cuenta ATH Business del cliente', estimatedDays: 2 },
    { title: 'Configurar Shopify Payments extension para ATH Business', estimatedDays: 2 },
    { title: 'Integrar Payment Button API en el checkout de Shopify', estimatedDays: 2 },
    { title: 'Configurar webhooks y probar flujo completo de pago', estimatedDays: 2 },
    { title: 'Entregar documentación y capacitar al cliente', estimatedDays: 1 },
  ],
  CUSTOM: [
    { title: 'Revisar plataforma del cliente y obtener accesos de administrador', estimatedDays: 1 },
    { title: 'Crear y configurar cuenta ATH Business del cliente', estimatedDays: 2 },
    { title: 'Diseñar flujo de pago e integración con la plataforma', estimatedDays: 3 },
    { title: 'Integrar Payment Button API en el checkout', estimatedDays: 4 },
    { title: 'Configurar webhooks y probar flujo completo de pago', estimatedDays: 2 },
    { title: 'Implementar manejo de errores y reintentos', estimatedDays: 2 },
    { title: 'Entregar documentación y capacitar al cliente', estimatedDays: 1 },
  ],
}

export const DEFAULT_TASKS = PROJECT_TEMPLATES.CUSTOM

export function getEstimatedDays(platform: string): number {
  const tasks = PROJECT_TEMPLATES[platform] ?? DEFAULT_TASKS
  return tasks.reduce((sum, t) => sum + t.estimatedDays, 0)
}
