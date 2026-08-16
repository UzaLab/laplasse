import type { AuthUser } from '@laplasse/api-client'

export type AppPersona = 'courier' | 'partner' | 'none'

export function resolvePersona(user: AuthUser | null): AppPersona {
  if (!user) return 'none'
  if (user.logistics_partner) return 'partner'
  if (user.courier_profile || user.role === 'COURIER') return 'courier'
  return 'none'
}

export function personaHomeRoute(persona: AppPersona): string {
  if (persona === 'partner') return '/(partner)'
  if (persona === 'courier') return '/(courier)'
  return '/(auth)/welcome'
}
