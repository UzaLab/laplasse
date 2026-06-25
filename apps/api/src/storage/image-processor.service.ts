import { Injectable, Logger } from '@nestjs/common'
import sharp from 'sharp'

export type ImagePreset = 'general' | 'product' | 'logo' | 'proof'

const PRESETS: Record<ImagePreset, { maxWidth: number; maxHeight: number; quality: number }> = {
  /** Médiathèque marchand, couvertures */
  general: { maxWidth: 1920, maxHeight: 1920, quality: 82 },
  /** Images produits catalogue */
  product: { maxWidth: 1600, maxHeight: 1600, quality: 85 },
  /** Logos partenaires logistique */
  logo: { maxWidth: 512, maxHeight: 512, quality: 88 },
  /** Preuves de livraison (qualité moindre, taille réduite) */
  proof: { maxWidth: 1200, maxHeight: 1200, quality: 78 },
}

export interface ProcessedImage {
  buffer: Buffer
  mimetype: 'image/webp'
  ext: 'webp'
  width: number
  height: number
  bytes: number
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name)

  /**
   * Redimensionne, convertit en WebP, supprime les métadonnées EXIF.
   * Réduit fortement l'egress Hetzner vs JPEG/PNG bruts.
   */
  async process(buffer: Buffer, preset: ImagePreset = 'general'): Promise<ProcessedImage> {
    const { maxWidth, maxHeight, quality } = PRESETS[preset]

    const pipeline = sharp(buffer, { failOn: 'none' })
      .rotate() // auto-orient EXIF
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 })

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })

    this.logger.debug(
      `Image ${preset}: ${buffer.length} → ${data.length} bytes (${info.width}x${info.height} webp)`,
    )

    return {
      buffer: data,
      mimetype: 'image/webp',
      ext: 'webp',
      width: info.width,
      height: info.height,
      bytes: data.length,
    }
  }

  /** Passe-through pour les fichiers non-image (PDF KYC, etc.). */
  passthrough(buffer: Buffer, mimetype: string): { buffer: Buffer; mimetype: string; ext: string } {
    const ext =
      mimetype === 'application/pdf'
        ? 'pdf'
        : mimetype === 'image/png'
          ? 'png'
          : mimetype === 'image/webp'
            ? 'webp'
            : 'jpg'
    return { buffer, mimetype, ext }
  }
}
