import { Module } from '@nestjs/common'
import { ShopCollectionsController } from './shop-collections.controller'
import { ShopCollectionsService } from './shop-collections.service'
import { ShopsModule } from '../shops/shops.module'

@Module({
  imports: [ShopsModule],
  controllers: [ShopCollectionsController],
  providers: [ShopCollectionsService],
  exports: [ShopCollectionsService],
})
export class ShopCollectionsModule {}
