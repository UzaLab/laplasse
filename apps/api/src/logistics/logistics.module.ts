import { Module, forwardRef } from '@nestjs/common'
import { LogisticsController } from './logistics.controller'
import { LogisticsPartnersService } from './logistics-partners.service'
import { LogisticsPartnerScoringService } from './logistics-partner-scoring.service'
import { LogisticsPartnerOpsService } from './logistics-partner-ops.service'
import { StorageModule } from '../storage/storage.module'
import { QueueModule } from '../queue/queue.module'
import { DeliveryModule } from '../delivery/delivery.module'
import { DeliveryZonesModule } from '../delivery-zones/delivery-zones.module'

@Module({
  imports: [StorageModule, QueueModule, forwardRef(() => DeliveryModule), DeliveryZonesModule],
  controllers: [LogisticsController],
  providers: [LogisticsPartnersService, LogisticsPartnerScoringService, LogisticsPartnerOpsService],
  exports: [LogisticsPartnersService, LogisticsPartnerScoringService, LogisticsPartnerOpsService],
})
export class LogisticsModule {}
