import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ProductFavoritesService } from './product-favorites.service'

@Controller('favorites/products')
@UseGuards(JwtAuthGuard)
export class ProductFavoritesController {
  constructor(private readonly productFavoritesService: ProductFavoritesService) {}

  @Get()
  findMine(@CurrentUser() user: { id: string }) {
    return this.productFavoritesService.findMine(user.id)
  }

  @Post(':productId')
  toggle(
    @Param('productId') productId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.productFavoritesService.toggle(productId, user.id)
  }

  @Get(':productId/check')
  check(
    @Param('productId') productId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.productFavoritesService.isFavorited(productId, user.id)
  }
}
