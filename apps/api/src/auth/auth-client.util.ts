import type { Request } from 'express'

export function isMobileClient(req: Request): boolean {
  const header = req.headers['x-client']
  if (typeof header === 'string' && header.toLowerCase() === 'mobile') return true
  const query = req.query?.client
  return typeof query === 'string' && query.toLowerCase() === 'mobile'
}

export function authSessionBody(
  req: Request,
  payload: { user: unknown; access_token: string; refresh_token: string },
) {
  if (isMobileClient(req)) {
    return {
      user: payload.user,
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
    }
  }
  return { user: payload.user }
}

export function authRefreshBody(
  req: Request,
  payload: { access_token: string; refresh_token: string },
) {
  if (isMobileClient(req)) {
    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
    }
  }
  return { success: true }
}
