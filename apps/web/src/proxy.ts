import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  COUNTRY_BY_SUBDOMAIN,
  COUNTRY_COOKIE,
  getCountrySubdomain,
  isRootDomainHost,
  isSupportedCountryCode,
  ROOT_DOMAIN,
} from '@/lib/country'

function redirectToHost(request: NextRequest, hostname: string): NextResponse {
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const path = `${request.nextUrl.pathname}${request.nextUrl.search}`
  return NextResponse.redirect(`${proto}://${hostname}${path}`)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/_next')
    || pathname.startsWith('/api')
    || pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const hostHeader = request.headers.get('host') ?? ''
  const host = hostHeader.split(':')[0]?.toLowerCase() ?? ''
  const root = ROOT_DOMAIN.toLowerCase()
  const isRootHost = isRootDomainHost(hostHeader)
  const isCountryHost = host.endsWith(`.${root}`) && !isRootHost

  if (!isRootHost && !isCountryHost) {
    return NextResponse.next()
  }

  if (host === `www.${root}`) {
    return redirectToHost(request, root)
  }

  if (isRootHost) {
    const savedCountry = request.cookies.get(COUNTRY_COOKIE)?.value?.trim().toUpperCase()
    if (savedCountry && isSupportedCountryCode(savedCountry)) {
      const sub = getCountrySubdomain(savedCountry)
      return redirectToHost(request, `${sub}.${root}`)
    }
    return NextResponse.next()
  }

  const sub = host.slice(0, -(`.${root}`.length)).split('.').pop()
  const country = sub ? COUNTRY_BY_SUBDOMAIN[sub] : null

  if (country) {
    const response = NextResponse.next()
    response.cookies.set(COUNTRY_COOKIE, country, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
