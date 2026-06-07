import { createHash, randomBytes } from 'crypto'
import type { ConfigService } from '@nestjs/config'

export function createRefreshTokenValue(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function refreshExpiresAt(config: ConfigService): Date {
  const raw = config.get<string>('JWT_REFRESH_EXPIRES') ?? '30d'
  return new Date(Date.now() + parseMaxAgeMs(raw))
}

function parseMaxAgeMs(expires: string): number {
  const match = expires.match(/^(\d+)([smhd])$/)
  if (!match) return 30 * 86_400_000
  const n = Number(match[1])
  const unit = match[2]
  const mult: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  }
  return n * (mult[unit] ?? 86_400_000)
}
