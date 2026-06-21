/** Tenancy pays — slice F2 (cookie, sous-domaine ou défaut CI) */

export const DEFAULT_COUNTRY = 'CI'
export const DEFAULT_CITY = 'Abidjan'
export const COUNTRY_HEADER = 'X-LaPlasse-Country'
export const COUNTRY_COOKIE = 'lp_country'
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'laplasse.tech'

export const SUBDOMAIN_BY_COUNTRY: Record<string, string> = {
  CI: 'ci',
  BF: 'bf',
  SN: 'sn',
}

export const COUNTRY_BY_SUBDOMAIN: Record<string, string> = Object.fromEntries(
  Object.entries(SUBDOMAIN_BY_COUNTRY).map(([country, subdomain]) => [subdomain, country]),
)

const CITY_BY_COUNTRY: Record<string, string> = {
  CI: 'Abidjan',
  BF: 'Ouagadougou',
  SN: 'Dakar',
}

export function getDefaultCity(country = DEFAULT_COUNTRY): string {
  return CITY_BY_COUNTRY[country.toUpperCase()] ?? DEFAULT_CITY
}

const PHONE_PLACEHOLDER_BY_COUNTRY: Record<string, string> = {
  CI: '+225 07 00 00 00 00',
  BF: '+226 70 00 00 00',
  SN: '+221 77 000 00 00',
}

export function getPhonePlaceholder(country = DEFAULT_COUNTRY): string {
  return PHONE_PLACEHOLDER_BY_COUNTRY[country.toUpperCase()] ?? PHONE_PLACEHOLDER_BY_COUNTRY.CI
}

export function getCountryLabel(code: string): string {
  return SUPPORTED_COUNTRIES.find(c => c.code === code.toUpperCase())?.label ?? code
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

export function getCountrySubdomain(countryCode: string): string {
  return SUBDOMAIN_BY_COUNTRY[countryCode.toUpperCase()] ?? countryCode.toLowerCase()
}

export function parseCountryFromHost(host: string): string | null {
  const hostname = host.split(':')[0]?.toLowerCase() ?? ''
  const root = ROOT_DOMAIN.toLowerCase()
  if (hostname === root || hostname === `www.${root}`) return null
  if (!hostname.endsWith(`.${root}`)) return null
  const sub = hostname.slice(0, -(`.${root}`.length)).split('.').pop()
  if (!sub) return null
  return COUNTRY_BY_SUBDOMAIN[sub] ?? null
}

/** Redirect sous-domaine pays (prod laplasse.tech uniquement). */
export function buildCountrySwitchUrl(
  countryCode: string,
  pathname = '/',
  search = '',
): string | null {
  if (typeof window === 'undefined') return null
  const root = ROOT_DOMAIN.toLowerCase()
  const host = window.location.hostname.toLowerCase()
  if (host !== root && host !== `www.${root}` && !host.endsWith(`.${root}`)) return null
  const sub = getCountrySubdomain(countryCode)
  return `${window.location.protocol}//${sub}.${root}${pathname}${search}`
}
