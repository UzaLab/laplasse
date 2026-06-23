import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import webpush, { type PushSubscription, type SendResult } from 'web-push'

export interface WebPushPayload {
  title: string
  body: string
  type?: string
  data?: Record<string, unknown>
}

@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name)
  private configured = false

  constructor(private readonly config: ConfigService) {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY')
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY')
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:contact@laplasse.ci'

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey)
      this.configured = true
      this.logger.log('Web Push VAPID configuré')
    } else {
      this.logger.warn('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY absents — Web Push désactivé')
    }
  }

  isConfigured(): boolean {
    return this.configured
  }

  getPublicKey(): string | null {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? null
  }

  async send(subscription: PushSubscription, payload: WebPushPayload): Promise<SendResult> {
    if (!this.configured) {
      throw new Error('Web Push non configuré')
    }

    return webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data ?? {},
      }),
      { TTL: 60 * 60 },
    )
  }
}
