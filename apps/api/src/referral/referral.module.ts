import { Module } from '@nestjs/common'
import { ReferralService } from './referral.service'
import { ReferralController } from './referral.controller'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [LoyaltyModule, NotificationsModule],
  controllers: [ReferralController],
  providers: [ReferralService],
  exports: [ReferralService],
})
export class ReferralModule {}
