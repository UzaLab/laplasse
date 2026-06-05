import { Controller, Get, Patch, Param } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  getAll(@CurrentUser('id') userId: string) {
    return this.svc.getAll(userId)
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
}
