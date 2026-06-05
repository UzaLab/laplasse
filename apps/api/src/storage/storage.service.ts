import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly s3Client: S3Client | null = null
  private readonly bucket: string | null
  private readonly publicUrlBase: string | null

  constructor(private readonly config: ConfigService) {
    const r2AccountId = config.get<string>('R2_ACCOUNT_ID')
    const r2AccessKey = config.get<string>('R2_ACCESS_KEY_ID')
    const r2Secret = config.get<string>('R2_SECRET_ACCESS_KEY')
    this.bucket = config.get<string>('R2_BUCKET') ?? null
    this.publicUrlBase = config.get<string>('R2_PUBLIC_URL') ?? null

    if (r2AccountId && r2AccessKey && r2Secret && this.bucket) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2AccessKey,
          secretAccessKey: r2Secret,
        },
      })
      this.logger.log('R2 storage initialized')
    } else {
      this.logger.warn('R2 not configured — using local disk storage')
    }
  }

  /**
   * Uploads a file buffer and returns its public URL.
   * Uses R2 in production when env vars are set, local disk otherwise.
   */
  async upload(
    buffer: Buffer,
    mimetype: string,
    folder: string,
  ): Promise<string> {
    const ext = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const key = `${folder}/${filename}`

    if (this.s3Client && this.bucket && this.publicUrlBase) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
          CacheControl: 'public, max-age=31536000',
        }),
      )
      return `${this.publicUrlBase.replace(/\/$/, '')}/${key}`
    }

    // Fallback: local disk
    const apiUrl = this.config.get('API_PUBLIC_URL') ?? 'http://localhost:3001'
    const dir = join(process.cwd(), 'uploads', folder)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, filename), buffer)
    return `${apiUrl}/uploads/${key}`
  }
}
