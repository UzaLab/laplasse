import { Module } from '@nestjs/common'
import { MarketplaceController } from './marketplace.controller'
import { MarketplaceService } from './marketplace.service'
import { ProductCategoriesService } from './product-categories.service'
import { QueueModule } from '../queue/queue.module'
import { ShopsModule } from '../shops/shops.module'
import { DeliveryZonesModule } from '../delivery-zones/delivery-zones.module'
import { PromotionsModule } from '../promotions/promotions.module'
import { SearchModule } from '../search/search.module'
import { AddressesModule } from '../addresses/addresses.module'

import { ShopCollectionsModule } from '../shop-collections/shop-collections.module'
import { ShopMenuModule } from '../shop-menu/shop-menu.module'
import { ProductReviewsModule } from '../product-reviews/product-reviews.module'
import { DeliveryModule } from '../delivery/delivery.module'

@Module({
  imports: [QueueModule, ShopsModule, DeliveryZonesModule, PromotionsModule, SearchModule, AddressesModule, ShopCollectionsModule, ShopMenuModule, ProductReviewsModule, DeliveryModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, ProductCategoriesService],
  exports: [MarketplaceService, ProductCategoriesService],
})
export class MarketplaceModule {}
