import { Module } from '@nestjs/common'
import { ShopMenuController } from './shop-menu.controller'
import { ShopMenuService } from './shop-menu.service'

@Module({
  controllers: [ShopMenuController],
  providers: [ShopMenuService],
  exports: [ShopMenuService],
})
export class ShopMenuModule {}
