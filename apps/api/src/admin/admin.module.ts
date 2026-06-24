import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminSeedService } from './admin-seed.service'
import { ComplaintsModule } from '../complaints/complaints.module'
import { SearchModule } from '../search/search.module'
import { MerchantsModule } from '../merchants/merchants.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { MarketplaceModule } from '../marketplace/marketplace.module'
import { GeoModule } from '../geo/geo.module'
import { CouriersModule } from '../couriers/couriers.module'
import { AuditModule } from '../audit/audit.module'
import { DeliveryModule } from '../delivery/delivery.module'
import { LogisticsModule } from '../logistics/logistics.module'
import { AdsModule } from '../ads/ads.module'

@Module({
  imports: [ComplaintsModule, SearchModule, MerchantsModule, NotificationsModule, MarketplaceModule, GeoModule, CouriersModule, AuditModule, DeliveryModule, LogisticsModule, AdsModule],
  controllers: [AdminController],
  providers: [AdminSeedService],
})
export class AdminModule {}
