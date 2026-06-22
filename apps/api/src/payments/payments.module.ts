import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { QueueModule } from '../queue/queue.module'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { PaymentsService } from './payments.service'
import { PaymentsController } from './payments.controller'

@Module({
  imports: [PrismaModule, QueueModule, LoyaltyModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
