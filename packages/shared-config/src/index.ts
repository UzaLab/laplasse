/** Tenancy pays — partagé web / mobile */

export const DEFAULT_COUNTRY = 'CI'
export const DEFAULT_CITY = 'Abidjan'
export const COUNTRY_HEADER = 'X-LaPlasse-Country'
export const MOBILE_CLIENT_HEADER = 'X-Client'
export const MOBILE_CLIENT_VALUE = 'mobile'

export const SUPPORTED_COUNTRIES = [
  { code: 'CI', label: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', label: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'SN', label: 'Sénégal', flag: '🇸🇳' },
] as const

const CITY_BY_COUNTRY: Record<string, string> = {
  CI: 'Abidjan',
  BF: 'Ouagadougou',
  SN: 'Dakar',
}

export function getDefaultCity(country = DEFAULT_COUNTRY): string {
  return CITY_BY_COUNTRY[country.toUpperCase()] ?? DEFAULT_CITY
}

export function getCountryLabel(code: string): string {
  return SUPPORTED_COUNTRIES.find(c => c.code === code.toUpperCase())?.label ?? code
}

export function getCountryFlag(code: string): string {
  return SUPPORTED_COUNTRIES.find(c => c.code === code.toUpperCase())?.flag ?? '🌍'
}

export function countryRequestHeaders(countryCode: string): Record<string, string> {
  return { [COUNTRY_HEADER]: countryCode.toUpperCase() }
}

export function mobileClientHeaders(): Record<string, string> {
  return { [MOBILE_CLIENT_HEADER]: MOBILE_CLIENT_VALUE }
}

export function getApiBaseUrl(envUrl?: string): string {
  const url = envUrl ?? 'http://localhost:3001/api'
  return url.replace(/\/$/, '')
}

export function formatPrice(amount: number | null | undefined, currency = 'XOF'): string {
  if (amount == null) return ''
  const label = currency === 'XOF' ? 'FCFA' : currency
  return `${amount.toLocaleString('fr-FR')} ${label}`
}

/** BusinessHour.day in DB: 0 = Monday … 6 = Sunday (not JS getDay()). */
export function businessDayFromDate(date: Date = new Date()): number {
  const jsDay = date.getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

export * from './apiEnv'
export * from './geo'
