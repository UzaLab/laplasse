import {
  COUNTRY_COOKIE,
  DEFAULT_COUNTRY,
  getCountryFromCookieStore,
  getCountryLabel,
  isSupportedCountryCode,
  ROOT_DOMAIN,
  SUBDOMAIN_BY_COUNTRY,
  buildSubdomainUrl,
} from '@/lib/country'

export const HREFLANG_LOCALES: Record<string, string> = {
  CI: 'fr-CI',
  BF: 'fr-BF',
  SN: 'fr-SN',
}

export function resolveCountryCode(cookieValue?: string | null, host?: string | null): string {
  if (host) {
    const hostname = host.split(':')[0]?.toLowerCase() ?? ''
    const root = ROOT_DOMAIN.toLowerCase()
    if (hostname.endsWith(`.${root}`)) {
      const sub = hostname.slice(0, -(`.${root}`.length)).split('.').pop()
      if (sub === 'ci') return 'CI'
      if (sub === 'bf') return 'BF'
      if (sub === 'sn') return 'SN'
    }
  }
  return getCountryFromCookieStore(cookieValue ?? undefined)
}

export function countrySiteUrl(country: string, pathname = '/'): string {
  const code = country.toUpperCase()
  const fromSubdomain = buildSubdomainUrl(code, pathname, '', 'https')
  if (fromSubdomain) return fromSubdomain
  const fallback = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'
  return `${fallback.replace(/\/$/, '')}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

export function buildHreflangLanguages(pathname = '/'): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const code of Object.keys(SUBDOMAIN_BY_COUNTRY)) {
    if (!isSupportedCountryCode(code)) continue
    const locale = HREFLANG_LOCALES[code] ?? `fr-${code}`
    languages[locale] = countrySiteUrl(code, pathname)
  }
  languages['x-default'] = countrySiteUrl(DEFAULT_COUNTRY, pathname)
  return languages
}

export function countryMetadataDescription(country: string): string {
  const label = getCountryLabel(country)
  return `Découvrez, réservez et achetez auprès des établissements premium en ${label} — restaurants, hôtels, salons et boutiques.`
}

export { COUNTRY_COOKIE }
