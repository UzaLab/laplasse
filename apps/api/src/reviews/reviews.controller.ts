import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('merchant/:merchantId')
  findByMerchant(
    @Param('merchantId') merchantId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reviewsService.findByMerchant(merchantId, {
      limit: limit ? Number(limit) : 4,
      offset: offset ? Number(offset) : 0,
    })
  }

  @Get('mine')
  findMine(@CurrentUser() user: { id: string }) {
    return this.reviewsService.findMine(user.id)
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  create(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reviewsService.create(dto, user.id)
  }
}
