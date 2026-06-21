/** Tenancy pays — slice F2 (local : cookie ou défaut CI) */

export const DEFAULT_COUNTRY = 'CI'
export const DEFAULT_CITY = 'Abidjan'
export const COUNTRY_HEADER = 'X-LaPlasse-Country'
export const COUNTRY_COOKIE = 'lp_country'

const CITY_BY_COUNTRY: Record<string, string> = {
  CI: 'Abidjan',
  BF: 'Ouagadougou',
  SN: 'Dakar',
}

export function getDefaultCity(country = DEFAULT_COUNTRY): string {
  return CITY_BY_COUNTRY[country.toUpperCase()] ?? DEFAULT_CITY
}

/** Côté client : lit le cookie lp_country */
export function getClientCountryCode(): string {
  if (typeof document === 'undefined') return DEFAULT_COUNTRY
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COUNTRY_COOKIE}=([^;]+)`))
  const code = match?.[1]?.trim().toUpperCase()
  return code && code.length === 2 ? code : DEFAULT_COUNTRY
}

/** SSR / build : variable d'environnement ou défaut */
export function getServerCountryCode(): string {
  return (
    process.env.DEFAULT_COUNTRY ??
    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY ??
    DEFAULT_COUNTRY
  ).toUpperCase()
}

export function getCountryCode(): string {
  if (typeof window === 'undefined') return getServerCountryCode()
  return getClientCountryCode()
}

export const SUPPORTED_COUNTRIES = [
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'BF', label: 'Burkina Faso' },
  { code: 'SN', label: 'Sénégal' },
] as const

/** SSR : lit le cookie lp_country (Next.js cookies()) */
export function getCountryFromCookieStore(
  cookieValue: string | undefined,
): string {
  const code = cookieValue?.trim().toUpperCase()
  if (code && code.length === 2) return code
  return getServerCountryCode()
}

export function setClientCountry(code: string) {
  if (typeof document === 'undefined') return
  const normalized = code.trim().toUpperCase()
  if (normalized.length !== 2) return
  document.cookie = `${COUNTRY_COOKIE}=${normalized};path=/;max-age=31536000;SameSite=Lax`
}

export function countryRequestHeaders(): Record<string, string> {
  return { [COUNTRY_HEADER]: getCountryCode() }
}
