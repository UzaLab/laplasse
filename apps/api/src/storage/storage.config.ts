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

/** Lit env Coolify (process.env) puis ConfigService — les deux sources sont nécessaires en prod. */
function env(config: ConfigService, key: string): string | undefined {
  return firstDefined(process.env[key], config.get<string>(key))
}

export function storageConfigDiagnostics(config: ConfigService): string[] {
  const required = [
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
    'R2_ENDPOINT',
  ] as const
  return required.filter(key => !env(config, key))
}

/**
 * Résout la config stockage depuis les variables d'environnement.
 *
 * Hetzner Object Storage (recommandé) :
 *   R2_ENDPOINT, R2_REGION, R2_BUCKET_NAME, R2_PUBLIC_URL
 *   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 */
export function resolveStorageConfig(config: ConfigService): ResolvedStorageConfig | null {
  const accessKeyId = firstDefined(
    env(config, 'S3_ACCESS_KEY_ID'),
    env(config, 'AWS_ACCESS_KEY_ID'),
    env(config, 'R2_ACCESS_KEY_ID'),
  )
  const secretAccessKey = firstDefined(
    env(config, 'S3_SECRET_ACCESS_KEY'),
    env(config, 'AWS_SECRET_ACCESS_KEY'),
    env(config, 'R2_SECRET_ACCESS_KEY'),
  )
  const bucket = firstDefined(env(config, 'R2_BUCKET_NAME'), env(config, 'R2_BUCKET'))
  const publicUrlBase = firstDefined(env(config, 'R2_PUBLIC_URL'))
  const endpoint = firstDefined(env(config, 'R2_ENDPOINT'))
  const region = firstDefined(env(config, 'R2_REGION')) ?? 'fsn1'
  const r2AccountId = firstDefined(env(config, 'R2_ACCOUNT_ID'))
  const explicitProvider = firstDefined(env(config, 'STORAGE_PROVIDER'))

  if (!accessKeyId || !secretAccessKey || !bucket || !publicUrlBase) {
    return null
  }

  if (endpoint) {
    const normalizedEndpoint = endpoint.replace(/\/$/, '')
    const upstreamHost =
      firstDefined(env(config, 'STORAGE_UPSTREAM_HOST')) ??
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
