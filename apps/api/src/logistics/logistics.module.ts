import { Module } from '@nestjs/common'
import { LogisticsController } from './logistics.controller'
import { LogisticsPartnersService } from './logistics-partners.service'
import { LogisticsPartnerScoringService } from './logistics-partner-scoring.service'
import { LogisticsPartnerOpsService } from './logistics-partner-ops.service'

@Module({
  controllers: [LogisticsController],
  providers: [LogisticsPartnersService, LogisticsPartnerScoringService, LogisticsPartnerOpsService],
  exports: [LogisticsPartnersService, LogisticsPartnerScoringService, LogisticsPartnerOpsService],
})
export class LogisticsModule {}
