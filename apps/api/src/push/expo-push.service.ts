import { Injectable, Logger } from '@nestjs/common'
import { Expo, ExpoPushMessage } from 'expo-server-sdk'

const URGENT_TYPES = new Set(['delivery_job_offered'])

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name)
  private readonly expo = new Expo()

  isExpoPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token)
  }

  async send(
    token: string,
    payload: {
      title: string
      body: string
      type?: string
      data?: Record<string, unknown>
    },
  ): Promise<boolean> {
    if (!this.isExpoPushToken(token)) {
      this.logger.warn(`Token Expo invalide: ${token.slice(0, 24)}…`)
      return false
    }

    const urgent = URGENT_TYPES.has(payload.type ?? '')
    const message: ExpoPushMessage = {
      to: token,
      sound: urgent ? 'default' : 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
      priority: urgent ? 'high' : 'default',
      ...(urgent ? { channelId: 'delivery' } : {}),
    }

    const tickets = await this.expo.sendPushNotificationsAsync([message])
    const ticket = tickets[0]
    if (ticket.status === 'error') {
      this.logger.warn(`Expo Push échec: ${ticket.message}`)
      return false
    }
    return true
  }
}
