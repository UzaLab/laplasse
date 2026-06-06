import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { PromotionsService } from './promotions.service'
import { CreatePromotionDto } from './dto/create-promotion.dto'

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly svc: PromotionsService) {}

  @Public()
  @Get('active')
  getPublicActive() {
    return this.svc.getPublicActivePromotions()
  }

  @Public()
  @Get('merchant/:merchantId')
  getMerchantPromotions(@Param('merchantId') merchantId: string) {
    return this.svc.getActivePromotions(merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMine(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.getMerchantPromotionsForOwner(userId, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePromotionDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.create(userId, dto, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  toggle(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.toggle(userId, id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.delete(userId, id, merchantId)
  }
}
