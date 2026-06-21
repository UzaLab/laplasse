import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { ComplaintsModule } from '../complaints/complaints.module'
import { SearchModule } from '../search/search.module'
import { MerchantsModule } from '../merchants/merchants.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { MarketplaceModule } from '../marketplace/marketplace.module'
import { GeoModule } from '../geo/geo.module'

@Module({
  imports: [ComplaintsModule, SearchModule, MerchantsModule, NotificationsModule, MarketplaceModule, GeoModule],
  controllers: [AdminController],
})
export class AdminModule {}
