type Level = 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: Level
  requestId?: string
  message: string
  [key: string]: unknown
}

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = { timestamp: new Date().toISOString(), level, message, ...meta }
  const out = level === 'error' ? console.error : console.log
  out(JSON.stringify(entry))
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
}

export function cronAlert(cronName: string, message: string, meta?: Record<string, unknown>) {
  logger.error(`[CRON:${cronName}] ${message}`, { cron: true, cronName, ...meta })
}
