import { Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { Public } from '../auth/decorators/public.decorator'
import { getAccessTokenFromRequest } from '../auth/auth-cookies'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ProductReviewsService } from './product-reviews.service'
import { CreateProductReviewDto } from './dto/product-review.dto'

@Controller('product-reviews')
export class ProductReviewsController {
  constructor(
    private readonly svc: ProductReviewsService,
    private readonly jwt: JwtService,
  ) {}

  @Public()
  @Get('products/:slug')
  async list(
    @Param('slug') slug: string,
    @Query('shop') shop?: string,
    @Req() req?: Request,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = await this.resolveOptionalUserId(req, authHeader)
    return this.svc.listByProductSlug(slug, shop, userId)
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

  private async resolveOptionalUserId(req?: Request, authHeader?: string): Promise<string | undefined> {
    if (!req) return undefined
    const token = getAccessTokenFromRequest(req, authHeader)
    if (!token) return undefined
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token)
      return payload.sub
    } catch {
      return undefined
    }
  }
}
