import { Module } from '@nestjs/common'
import { ShopMenuController } from './shop-menu.controller'
import { ShopMenuService } from './shop-menu.service'
import { ComposedMenuService } from './composed-menu.service'
import { SearchModule } from '../search/search.module'

@Module({
  imports: [SearchModule],
  controllers: [ShopMenuController],
  providers: [ShopMenuService, ComposedMenuService],
  exports: [ShopMenuService, ComposedMenuService],
})
export class ShopMenuModule {}
