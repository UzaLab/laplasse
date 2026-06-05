import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common'
import { FavoritesService } from './favorites.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findMine(@CurrentUser() user: { id: string }) {
    return this.favoritesService.findMine(user.id)
  }

  // Toggle par POST /:merchantId (utilisé par le frontend)
  @Post(':merchantId')
  toggle(
    @Param('merchantId') merchantId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.favoritesService.toggle(merchantId, user.id)
  }

  // Check /favorites/:merchantId/check
  @Get(':merchantId/check')
  check(
    @Param('merchantId') merchantId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.favoritesService.isFavorited(merchantId, user.id)
  }
}
