import { Module } from '@nestjs/common'
import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { FraudModule } from '../fraud/fraud.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [LoyaltyModule, FraudModule, NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
