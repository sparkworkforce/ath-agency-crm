export interface TaxConfig {
  currency: string
  currencySymbol: string
  taxName: string
  taxRate: number // e.g., 0.115 for 11.5%
  locale: string
}

const DEFAULTS: Record<string, TaxConfig> = {
  PR: { currency: 'USD', currencySymbol: '$', taxName: 'IVU', taxRate: 0.115, locale: 'es-PR' },
  US: { currency: 'USD', currencySymbol: '$', taxName: 'Sales Tax', taxRate: 0.0, locale: 'en-US' },
  DO: { currency: 'DOP', currencySymbol: 'RD$', taxName: 'ITBIS', taxRate: 0.18, locale: 'es-DO' },
  MX: { currency: 'MXN', currencySymbol: '$', taxName: 'IVA', taxRate: 0.16, locale: 'es-MX' },
  CO: { currency: 'COP', currencySymbol: '$', taxName: 'IVA', taxRate: 0.19, locale: 'es-CO' },
}

export function getDefaultTaxConfig(countryCode = 'PR'): TaxConfig {
  return DEFAULTS[countryCode] ?? DEFAULTS.PR
}

export function formatCurrency(amount: number, config: TaxConfig): string {
  return new Intl.NumberFormat(config.locale, { style: 'currency', currency: config.currency }).format(amount)
}

export function calculateTax(subtotal: number, taxRate: number): { tax: number; total: number } {
  const tax = Math.round(subtotal * taxRate * 100) / 100
  return { tax, total: Math.round((subtotal + tax) * 100) / 100 }
}

export const SUPPORTED_CURRENCIES = Object.entries(DEFAULTS).map(([code, config]) => ({
  code, currency: config.currency, symbol: config.currencySymbol, taxName: config.taxName, taxRate: config.taxRate,
}))
