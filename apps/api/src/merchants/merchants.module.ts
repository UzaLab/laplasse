import { Module } from '@nestjs/common'
import { MerchantsController } from './merchants.controller'
import { MerchantsService } from './merchants.service'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [StorageModule],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
