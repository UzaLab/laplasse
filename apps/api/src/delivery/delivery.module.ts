import { Module, forwardRef } from '@nestjs/common'
import { DeliveryController } from './delivery.controller'
import { DeliveryService } from './delivery.service'
import { DeliveryOfferService } from './delivery-offer.service'
import { DeliveryProofService } from './delivery-proof.service'
import { DeliveryDisputesService } from './delivery-disputes.service'
import { DeliveryEtaService } from './delivery-eta.service'
import { DeliveryFeeSplitService } from './delivery-fee-split.service'
import { QueueModule } from '../queue/queue.module'
import { LogisticsModule } from '../logistics/logistics.module'

@Module({
  imports: [QueueModule, forwardRef(() => LogisticsModule)],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    DeliveryOfferService,
    DeliveryProofService,
    DeliveryDisputesService,
    DeliveryEtaService,
    DeliveryFeeSplitService,
  ],
  exports: [
    DeliveryService,
    DeliveryOfferService,
    DeliveryProofService,
    DeliveryDisputesService,
    DeliveryEtaService,
    DeliveryFeeSplitService,
  ],
})
export class DeliveryModule {}
