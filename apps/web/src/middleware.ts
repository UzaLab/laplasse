/**
 * Next.js Edge Middleware — Géolocalisation pays multi-tenant
 *
 * Priorité de résolution du pays :
 *   1. Sous-domaine (bf.laplasse.tech → BF, sn.laplasse.tech → SN, etc.)
 *   2. Cookie `lp_country` (choix explicite de l'utilisateur)
 *   3. Pays par défaut : CI
 *
 * Injecte `X-LaPlasse-Country` sur chaque requête pour que les
 * Server Components puissent lire le pays via `headers()`.
 */

import { type NextRequest, NextResponse } from 'next/server'

const COUNTRY_COOKIE = 'lp_country'
const COUNTRY_HEADER = 'X-LaPlasse-Country'
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'laplasse.tech'
const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY ?? 'CI'

const SUBDOMAIN_TO_COUNTRY: Record<string, string> = {
  ci: 'CI',
  bf: 'BF',
  sn: 'SN',
}

function parseCountryFromHost(host: string): string | null {
  const hostname = host.split(':')[0]?.toLowerCase() ?? ''
  const root = ROOT_DOMAIN.toLowerCase()
  if (hostname === root || hostname === `www.${root}`) return null
  if (!hostname.endsWith(`.${root}`)) return null
  const sub = hostname.slice(0, -(`.${root}`.length)).split('.').pop()
  if (!sub) return null
  return SUBDOMAIN_TO_COUNTRY[sub] ?? null
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''

  // 1. Sous-domaine
  const subdomainCountry = parseCountryFromHost(host)

  // 2. Cookie utilisateur
  const cookieCountry = request.cookies.get(COUNTRY_COOKIE)?.value?.trim().toUpperCase()
  const validCookie = cookieCountry && /^[A-Z]{2}$/.test(cookieCountry) ? cookieCountry : null

  // Sous-domaine > cookie > défaut
  const country = subdomainCountry ?? validCookie ?? DEFAULT_COUNTRY

  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(request.headers.entries()),
        [COUNTRY_HEADER]: country,
      }),
    },
  })

  // Synchronise le cookie si le pays vient du sous-domaine
  if (subdomainCountry && subdomainCountry !== validCookie) {
    response.cookies.set(COUNTRY_COOKIE, subdomainCountry, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  return response
}

export const config = {
  matcher: [
    // Toutes les routes sauf assets statiques et fichiers spéciaux Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)).*)',
  ],
}
