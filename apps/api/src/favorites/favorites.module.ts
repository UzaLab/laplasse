import { Module } from '@nestjs/common'
import { FavoritesController } from './favorites.controller'
import { FavoritesService } from './favorites.service'
import { ProductFavoritesController } from './product-favorites.controller'
import { ProductFavoritesService } from './product-favorites.service'

@Module({
  controllers: [FavoritesController, ProductFavoritesController],
  providers: [FavoritesService, ProductFavoritesService],
})
export class FavoritesModule {}
