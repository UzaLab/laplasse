import { Injectable, Logger } from '@nestjs/common'
import { Expo, ExpoPushMessage } from 'expo-server-sdk'

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name)
  private readonly expo = new Expo()

  isExpoPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token)
  }

  async send(
    token: string,
    payload: { title: string; body: string; data?: Record<string, unknown> },
  ): Promise<boolean> {
    if (!this.isExpoPushToken(token)) {
      this.logger.warn(`Token Expo invalide: ${token.slice(0, 24)}…`)
      return false
    }

    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
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
