import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { ImagePreset, ImageProcessorService } from './image-processor.service'
import { resolveStorageConfig, storageConfigDiagnostics } from './storage.config'

/** Cache longue durée — les clés sont immuables (UUID). Réduit l'egress via CDN/proxy. */
const CACHE_CONTROL = 'public, max-age=31536000, immutable'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly s3Client: S3Client | null = null
  private readonly bucket: string | null = null
  private readonly publicUrlBase: string | null = null
  private readonly providerLabel: string = 'local'

  constructor(
    private readonly config: ConfigService,
    private readonly imageProcessor: ImageProcessorService,
  ) {
    const resolved = resolveStorageConfig(config)
    const forceLocal =
      process.env.STORAGE_FORCE_LOCAL === 'true' ||
      (process.env.NODE_ENV !== 'production' && process.env.STORAGE_FORCE_LOCAL !== 'false')

    if (resolved && !forceLocal) {
      this.s3Client = new S3Client({
        region: resolved.region,
        endpoint: resolved.endpoint,
        credentials: {
          accessKeyId: resolved.accessKeyId,
          secretAccessKey: resolved.secretAccessKey,
        },
        forcePathStyle: false,
      })
      this.bucket = resolved.bucket
      this.publicUrlBase = resolved.publicUrlBase
      this.providerLabel = resolved.provider === 'r2' ? 'Cloudflare R2' : 'S3 (Hetzner)'
      this.logger.log(`${this.providerLabel} storage initialized — bucket=${resolved.bucket}`)
    } else if (resolved && forceLocal) {
      this.logger.warn(
        'STORAGE_FORCE_LOCAL actif — stockage distant ignoré, utilisation du disque local (dev)',
      )
    } else {
      const missing = storageConfigDiagnostics(config)
      this.logger.warn(
        `Object storage not configured — using local disk (dev only). Missing: ${missing.join(', ') || 'unknown'}`,
      )
    }
  }

  get isRemote(): boolean {
    return this.s3Client !== null
  }

  /**
   * Upload image optimisée (WebP, redimensionnée).
   * Tous les uploads image passent par l'API — pas d'upload direct navigateur → S3.
   */
  async uploadImage(
    buffer: Buffer,
    _originalMimetype: string,
    folder: string,
    preset: ImagePreset = 'general',
  ): Promise<string> {
    const processed = await this.imageProcessor.process(buffer, preset)
    const filename = `${randomUUID()}.${processed.ext}`
    const key = `${folder}/${filename}`
    return this.putObject(processed.buffer, processed.mimetype, key)
  }

  /**
   * Upload fichier brut (PDF KYC, etc.) sans transformation.
   */
  async uploadRaw(buffer: Buffer, mimetype: string, folder: string): Promise<string> {
    const { buffer: body, mimetype: contentType, ext } = this.imageProcessor.passthrough(buffer, mimetype)
    const filename = `${randomUUID()}.${ext}`
    const key = `${folder}/${filename}`
    return this.putObject(body, contentType, key)
  }

  /**
   * @deprecated Préférer uploadImage ou uploadRaw.
   */
  async upload(buffer: Buffer, mimetype: string, folder: string): Promise<string> {
    if (mimetype.startsWith('image/')) {
      return this.uploadImage(buffer, mimetype, folder)
    }
    return this.uploadRaw(buffer, mimetype, folder)
  }

  private async putObject(buffer: Buffer, mimetype: string, key: string): Promise<string> {
    if (this.s3Client && this.bucket && this.publicUrlBase) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
          CacheControl: CACHE_CONTROL,
        }),
      )
      return `${this.publicUrlBase}/${key}`
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Stockage objet non configuré en production (vérifiez S3_ACCESS_KEY_ID, R2_ENDPOINT, R2_BUCKET_NAME, R2_PUBLIC_URL)',
      )
    }

    // Fallback dev : disque local servi par express.static
    const apiUrl = (this.config.get('API_PUBLIC_URL') ?? 'http://localhost:3001').replace(/\/$/, '')
    const dir = join(process.cwd(), 'uploads', key.split('/').slice(0, -1).join('/'))
    await mkdir(dir, { recursive: true })
    await writeFile(join(process.cwd(), 'uploads', key), buffer)
    return `${apiUrl}/uploads/${key}`
  }
}
