import { Injectable, Logger, OnModuleDestroy, BadRequestException, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class OtpService implements OnModuleDestroy {
  private readonly logger = new Logger(OtpService.name)
  private readonly redis: Redis

  constructor(private readonly config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379'
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 5) return null  // Arrête les retries après 5 tentatives
        return Math.min(times * 1000, 10_000)
      },
      reconnectOnError: () => false,
    })
    this.redis.on('error', (err) => {
      this.logger.warn(`Redis indisponible: ${err.message}`)
    })
    // Tentative de connexion non bloquante
    this.redis.connect().catch(() => {})
  }

  onModuleDestroy() {
    this.redis.disconnect()
  }

  normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 8) throw new BadRequestException('Numéro de téléphone invalide')
    return digits
  }

  async send(phone: string, purpose: string): Promise<{ sent: boolean; expires_in: number; dev_code?: string }> {
    const normalized = this.normalizePhone(phone)
    const rateKey = `otp_rate:${purpose}:${normalized}`

    const attempts = await this.redis.incr(rateKey)
    if (attempts === 1) await this.redis.expire(rateKey, 3600)
    if (attempts > 5) {
      throw new HttpException('Trop de demandes. Réessayez dans 1 heure.', HttpStatus.TOO_MANY_REQUESTS)
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const key = `otp:${purpose}:${normalized}`
    const ttl = 600

    await this.redis.setex(key, ttl, code)

    // En dev : log console (pas de SMS provider en V0.5)
    this.logger.log(`📱 OTP [${purpose}] → +${normalized} : ${code}`)

    const result: { sent: boolean; expires_in: number; dev_code?: string } = {
      sent: true,
      expires_in: ttl,
    }

    if (this.config.get('NODE_ENV') === 'development') {
      result.dev_code = code
    }

    return result
  }

  async verify(phone: string, purpose: string, code: string): Promise<boolean> {
    const normalized = this.normalizePhone(phone)
    const key = `otp:${purpose}:${normalized}`
    const stored = await this.redis.get(key)

    if (!stored || stored !== code.trim()) return false

    await this.redis.del(key)
    return true
  }
}
