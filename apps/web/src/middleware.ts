import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  COUNTRY_BY_SUBDOMAIN,
  COUNTRY_COOKIE,
  DEFAULT_COUNTRY,
  getCountrySubdomain,
  ROOT_DOMAIN,
} from '@/lib/country'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/_next')
    || pathname.startsWith('/api')
    || pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase() ?? ''
  const root = ROOT_DOMAIN.toLowerCase()
  const isRootHost = host === root || host === `www.${root}`
  const isCountryHost = host.endsWith(`.${root}`) && !isRootHost

  if (!isRootHost && !isCountryHost) {
    return NextResponse.next()
  }

  if (isRootHost) {
    const sub = getCountrySubdomain(DEFAULT_COUNTRY)
    const url = request.nextUrl.clone()
    url.hostname = `${sub}.${root}`
    return NextResponse.redirect(url)
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
