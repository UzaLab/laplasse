import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ProductReviewsService } from './product-reviews.service'
import { CreateProductReviewDto } from './dto/product-review.dto'

@Controller('product-reviews')
export class ProductReviewsController {
  constructor(private readonly svc: ProductReviewsService) {}

  @Public()
  @Get('products/:slug')
  list(
    @Param('slug') slug: string,
    @Query('shop') shop?: string,
  ) {
    return this.svc.listByProductSlug(slug, shop)
  }

  @UseGuards(JwtAuthGuard)
  @Post('products/:slug')
  create(
    @CurrentUser('id') userId: string,
    @Param('slug') slug: string,
    @Body() dto: CreateProductReviewDto,
    @Query('shop') shop?: string,
  ) {
    return this.svc.create(userId, slug, dto, shop)
  }
}
