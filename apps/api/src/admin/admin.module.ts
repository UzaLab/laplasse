import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { ComplaintsModule } from '../complaints/complaints.module'
import { SearchModule } from '../search/search.module'
import { MerchantsModule } from '../merchants/merchants.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { MarketplaceModule } from '../marketplace/marketplace.module'

@Module({
  imports: [ComplaintsModule, SearchModule, MerchantsModule, NotificationsModule, MarketplaceModule],
  controllers: [AdminController],
})
export class AdminModule {}
