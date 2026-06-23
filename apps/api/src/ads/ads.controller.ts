import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { AdsService } from './ads.service'
import { ConfirmAdPaymentDto, CreateAdCampaignDto, RecordAdEventDto } from './dto/ad.dto'

@Controller('ads')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('eligibility')
  eligibility(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.ads.getEligibility(userId, merchantId, shopId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('campaigns/stats')
  stats(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.ads.getCampaignStats(userId, merchantId, shopId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('campaigns')
  listMine(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.ads.listCampaigns(userId, merchantId, shopId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaigns')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAdCampaignDto,
    @Query('merchantId') merchantId?: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.ads.createCampaign(userId, dto, merchantId, shopId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaigns/:id/cancel-waitlist')
  cancelWaitlist(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
  ) {
    return this.ads.cancelWaitlist(userId, campaignId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('campaigns/confirm')
  confirm(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmAdPaymentDto,
  ) {
    return this.ads.confirmAdPayment(userId, dto.paymentId, dto.simulateResult)
  }

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('events')
  recordEvent(@Body() dto: RecordAdEventDto) {
    return this.ads.recordEvent(dto.campaignId, dto.event)
  }

  @Get('pricing')
  pricing() {
    return this.ads.getPricing()
  }
}
