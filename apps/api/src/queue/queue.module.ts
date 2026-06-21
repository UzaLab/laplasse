import { Global, Module } from '@nestjs/common'
import { NotificationQueueService } from './notification-queue.service'
import { CronController } from './cron.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [CronController],
  providers: [NotificationQueueService],
  exports: [NotificationQueueService],
})
export class QueueModule {}
