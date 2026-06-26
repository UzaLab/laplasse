import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { NotificationsController } from './notifications.controller'
import { AdminNotificationsService } from './admin-notifications.service'
import { PushModule } from '../push/push.module'

@Module({
  imports: [PushModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, AdminNotificationsService],
  exports: [NotificationsService, AdminNotificationsService],
})
export class NotificationsModule {}
