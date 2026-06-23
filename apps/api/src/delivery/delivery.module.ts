import { Module } from '@nestjs/common'
import { DeliveryController } from './delivery.controller'
import { DeliveryService } from './delivery.service'
import { DeliveryOfferService } from './delivery-offer.service'
import { DeliveryProofService } from './delivery-proof.service'
import { DeliveryDisputesService } from './delivery-disputes.service'
import { QueueModule } from '../queue/queue.module'

@Module({
  imports: [QueueModule],
  controllers: [DeliveryController],
  providers: [DeliveryService, DeliveryOfferService, DeliveryProofService, DeliveryDisputesService],
  exports: [DeliveryService, DeliveryOfferService, DeliveryProofService, DeliveryDisputesService],
})
export class DeliveryModule {}
