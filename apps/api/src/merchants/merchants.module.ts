import { Module } from '@nestjs/common'
import { MerchantsController } from './merchants.controller'
import { MerchantsService } from './merchants.service'
import { StorageModule } from '../storage/storage.module'
import { ShopMenuModule } from '../shop-menu/shop-menu.module'
import { AdsModule } from '../ads/ads.module'
import { CrmModule } from '../crm/crm.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { DeliveryZonesModule } from '../delivery-zones/delivery-zones.module'

@Module({
  imports: [StorageModule, ShopMenuModule, AdsModule, CrmModule, NotificationsModule, DeliveryZonesModule],
  controllers: [MerchantsController],
  providers: [MerchantsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
