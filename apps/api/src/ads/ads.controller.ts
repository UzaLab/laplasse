import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { AdsService } from './ads.service'
import { ConfirmAdPaymentDto, CreateAdCampaignDto } from './dto/ad.dto'

@Controller('ads')
@UseGuards(JwtAuthGuard)
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  @Get('campaigns')
  listMine(@CurrentUser('id') userId: string, @Query('merchantId') merchantId?: string) {
    return this.ads.listCampaigns(userId, merchantId)
  }

  @Post('campaigns')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAdCampaignDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.ads.createCampaign(userId, dto, merchantId)
  }

  @Post('campaigns/confirm')
  confirm(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmAdPaymentDto,
  ) {
    return this.ads.confirmAdPayment(userId, dto.paymentId, dto.simulateResult)
  }

  @Get('pricing')
  pricing() {
    return this.ads.getPricing()
  }
}
