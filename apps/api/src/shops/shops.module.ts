import { Module } from '@nestjs/common'
import { ShopsController } from './shops.controller'
import { ShopsService } from './shops.service'
import { DeliveryZonesModule } from '../delivery-zones/delivery-zones.module'
import { ShopCourierStaffService } from './shop-courier-staff.service'
import { LogisticsModule } from '../logistics/logistics.module'

@Module({
  imports: [DeliveryZonesModule, LogisticsModule],
  controllers: [ShopsController],
  providers: [ShopsService, ShopCourierStaffService],
  exports: [ShopsService, ShopCourierStaffService],
})
export class ShopsModule {}
