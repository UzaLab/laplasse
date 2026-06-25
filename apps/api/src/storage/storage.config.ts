import { ConfigService } from '@nestjs/config'

export type StorageProvider = 's3' | 'r2' | 'local'

export interface ResolvedStorageConfig {
  provider: StorageProvider
  endpoint: string
  region: string
  bucket: string
  publicUrlBase: string
  accessKeyId: string
  secretAccessKey: string
  /** Host header for reverse-proxy upstream (Hetzner bucket hostname). */
  upstreamHost?: string
}

function firstDefined(...values: Array<string | undefined | null>): string | undefined {
  for (const v of values) {
    if (v?.trim()) return v.trim()
  }
  return undefined
}

/**
 * Résout la config stockage depuis les variables d'environnement.
 *
 * Hetzner Object Storage (recommandé) :
 *   R2_ENDPOINT, R2_REGION, R2_BUCKET_NAME, R2_PUBLIC_URL
 *   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 *
 * Cloudflare R2 (legacy) :
 *   R2_ACCOUNT_ID + mêmes clés
 *
 * Coolify : préférer S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY (pas R2_ACCESS_KEY_ID).
 */
export function resolveStorageConfig(config: ConfigService): ResolvedStorageConfig | null {
  const accessKeyId = firstDefined(
    config.get<string>('S3_ACCESS_KEY_ID'),
    config.get<string>('AWS_ACCESS_KEY_ID'),
    config.get<string>('R2_ACCESS_KEY_ID'),
  )
  const secretAccessKey = firstDefined(
    config.get<string>('S3_SECRET_ACCESS_KEY'),
    config.get<string>('AWS_SECRET_ACCESS_KEY'),
    config.get<string>('R2_SECRET_ACCESS_KEY'),
  )
  const bucket = firstDefined(
    config.get<string>('R2_BUCKET_NAME'),
    config.get<string>('R2_BUCKET'),
  )
  const publicUrlBase = firstDefined(config.get<string>('R2_PUBLIC_URL'))
  const endpoint = firstDefined(config.get<string>('R2_ENDPOINT'))
  const region = firstDefined(config.get<string>('R2_REGION')) ?? 'fsn1'
  const r2AccountId = firstDefined(config.get<string>('R2_ACCOUNT_ID'))
  const explicitProvider = firstDefined(config.get<string>('STORAGE_PROVIDER'))

  if (!accessKeyId || !secretAccessKey || !bucket || !publicUrlBase) {
    return null
  }

  // Hetzner / S3-compatible endpoint explicite
  if (endpoint) {
    const normalizedEndpoint = endpoint.replace(/\/$/, '')
    const upstreamHost =
      firstDefined(config.get<string>('STORAGE_UPSTREAM_HOST')) ??
      `${bucket}.${region}.your-objectstorage.com`

    return {
      provider: explicitProvider === 'r2' ? 'r2' : 's3',
      endpoint: normalizedEndpoint,
      region,
      bucket,
      publicUrlBase: publicUrlBase.replace(/\/$/, ''),
      accessKeyId,
      secretAccessKey,
      upstreamHost,
    }
  }

  // Cloudflare R2 legacy
  if (r2AccountId) {
    return {
      provider: 'r2',
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      bucket,
      publicUrlBase: publicUrlBase.replace(/\/$/, ''),
      accessKeyId,
      secretAccessKey,
    }
  }

  return null
}
