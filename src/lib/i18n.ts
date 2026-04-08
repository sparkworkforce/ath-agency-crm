// i18n-ready string constants. Replace with a proper i18n library (next-intl, etc.) when needed.
// All UI-facing strings are centralized here for easy translation.

export const t = {
  // Common
  save: 'Guardar',
  cancel: 'Cancelar',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  loading: 'Cargando...',
  error: 'Error',
  success: 'Éxito',
  back: 'Volver',
  next: 'Siguiente',
  previous: 'Anterior',
  search: 'Buscar',
  noResults: 'Sin resultados',
  unauthorized: 'No autorizado',
  serverError: 'Error interno del servidor',
  invalidData: 'Datos inválidos',

  // Auth
  login: 'Iniciar sesión',
  logout: 'Cerrar sesión',
  register: 'Registrar agencia',
  email: 'Correo electrónico',
  password: 'Contraseña',
  loginError: 'Credenciales incorrectas. Intenta de nuevo.',
  noAccount: '¿No tienes cuenta?',
  hasAccount: '¿Ya tienes cuenta?',

  // Navigation
  dashboard: 'Dashboard',
  clients: 'Clientes',
  projects: 'Proyectos',
  invoices: 'Facturas',
  snippets: 'Snippets',
  users: 'Usuarios',
  settings: 'Configuración',

  // Clients
  newClient: 'Nuevo cliente',
  businessName: 'Nombre del negocio',
  contactName: 'Nombre de contacto',
  contactEmail: 'Email de contacto',
  phone: 'Teléfono',
  industry: 'Industria',
  platform: 'Plataforma',
  status: 'Estado',
  offboarding: 'Offboarding',

  // Client statuses
  statusProspecto: 'Prospecto',
  statusEnProgreso: 'En progreso',
  statusCompletado: 'Completado',
  statusSoporteMensual: 'Soporte mensual',

  // Projects
  newProject: 'Nuevo proyecto',
  progress: 'Progreso',
  tasks: 'Tareas',
  assignedTo: 'Asignado a',
  dueDate: 'Fecha límite',

  // Task statuses
  taskPendiente: 'Pendiente',
  taskEnProgreso: 'En progreso',
  taskCompletado: 'Completado',
  taskVencido: 'Vencido',

  // Invoices
  newInvoice: 'Nueva factura',
  totalAmount: 'Monto total',
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
  retainer: 'Retainer',
  recordPayment: 'Registrar pago',
  downloadPdf: 'Descargar PDF',

  // Export
  exportCsv: 'Exportar CSV',

  // Settings
  agencyName: 'Nombre de la agencia',
  primaryColor: 'Color primario',
  logoUrl: 'URL del logo',
  currentPlan: 'Plan actual',
} as const

export type TranslationKey = keyof typeof t
