import { Module } from '@nestjs/common'
import { CouriersController } from './couriers.controller'
import { CouriersService } from './couriers.service'
import { CourierJobsService } from './courier-jobs.service'
import { CourierWalletService } from './courier-wallet.service'
import { CourierReviewsService } from './courier-reviews.service'
import { DeliveryModule } from '../delivery/delivery.module'
import { AuditModule } from '../audit/audit.module'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [DeliveryModule, AuditModule, StorageModule],
  controllers: [CouriersController],
  providers: [CouriersService, CourierJobsService, CourierWalletService, CourierReviewsService],
  exports: [CouriersService, CourierJobsService, CourierWalletService, CourierReviewsService],
})
export class CouriersModule {}
