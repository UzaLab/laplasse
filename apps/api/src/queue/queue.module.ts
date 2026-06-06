import { Global, Module } from '@nestjs/common'
import { NotificationQueueService } from './notification-queue.service'
import { PrismaModule } from '../prisma/prisma.module'

@Global()
@Module({
  imports: [PrismaModule],
  providers: [NotificationQueueService],
  exports: [NotificationQueueService],
})
export class QueueModule {}
