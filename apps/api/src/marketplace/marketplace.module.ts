import { Module } from '@nestjs/common'
import { MarketplaceController } from './marketplace.controller'
import { MarketplaceService } from './marketplace.service'
import { QueueModule } from '../queue/queue.module'
import { ShopsModule } from '../shops/shops.module'

@Module({
  imports: [QueueModule, ShopsModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
