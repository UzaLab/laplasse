import { Body, Controller, Delete, Get, Patch, Param, Post, Query } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Public } from '../auth/decorators/public.decorator'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  getPage(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unread_only') unreadOnly?: string,
  ) {
    const parsedPage = page ? Number.parseInt(page, 10) : 1
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 20
    return this.svc.getPage(userId, {
      page: Number.isFinite(parsedPage) ? parsedPage : 1,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : 20,
      unreadOnly: unreadOnly === 'true' || unreadOnly === '1',
    })
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') userId: string) {
    return this.svc.unreadCount(userId).then((count) => ({ count }))
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string) {
    return this.svc.markAllRead(userId)
  }

  @Patch(':id/read')
  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.svc.markRead(userId, id)
  }

  @Public()
  @Get('push/vapid-public-key')
  getVapidPublicKey() {
    return { publicKey: this.svc.getWebPushPublicKey() }
  }

  @Post('push/subscribe')
  subscribePush(
    @CurrentUser('id') userId: string,
    @Body() body: { subscription: Record<string, unknown> },
  ) {
    return this.svc.registerWebPushSubscription(userId, body.subscription)
  }

  @Delete('push/subscribe')
  unsubscribePush(
    @CurrentUser('id') userId: string,
    @Body() body: { endpoint?: string },
  ) {
    return this.svc.unregisterWebPushSubscription(userId, body?.endpoint)
  }
}
