import type { Response, Request } from 'express'
import type { ConfigService } from '@nestjs/config'

export const ACCESS_COOKIE = 'laplasse_access'
export const REFRESH_COOKIE = 'laplasse_refresh'

function isProduction(config: ConfigService): boolean {
  return config.get('NODE_ENV') === 'production'
}

function cookieBase(config: ConfigService) {
  return {
    httpOnly: true,
    secure: isProduction(config),
    sameSite: 'lax' as const,
  }
}

export function setAuthCookies(
  res: Response,
  config: ConfigService,
  accessToken: string,
  refreshToken: string,
) {
  const base = cookieBase(config)
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    path: '/api',
    maxAge: parseMaxAgeMs(config.get('JWT_ACCESS_EXPIRES') ?? '15m'),
  })
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    path: '/api/auth',
    maxAge: parseMaxAgeMs(config.get('JWT_REFRESH_EXPIRES') ?? '30d'),
  })
}

export function clearAuthCookies(res: Response, config: ConfigService) {
  const base = cookieBase(config)
  res.clearCookie(ACCESS_COOKIE, { ...base, path: '/api' })
  res.clearCookie(REFRESH_COOKIE, { ...base, path: '/api/auth' })
}

export function getRefreshTokenFromRequest(req: Request): string | null {
  const fromCookie = req.cookies?.[REFRESH_COOKIE]
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie
  return null
}

export function getAccessTokenFromRequest(req: Request, authHeader?: string): string | null {
  const fromCookie = req.cookies?.[ACCESS_COOKIE]
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    if (token.length > 0) return token
  }
  return null
}

function parseMaxAgeMs(expires: string): number {
  const match = expires.match(/^(\d+)([smhd])$/)
  if (!match) return 15 * 60 * 1000
  const n = Number(match[1])
  const unit = match[2]
  const mult: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  }
  return n * (mult[unit] ?? 60_000)
}
