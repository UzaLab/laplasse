import {
  Controller, Get, Param, Query, Post, Patch, Delete, Body, NotFoundException, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException, Req,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Public } from '../auth/decorators/public.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { MerchantsService } from './merchants.service'
import { QueryMerchantsDto } from './dto/query-merchants.dto'
import { ShopMenuService } from '../shop-menu/shop-menu.service'
import { DEFAULT_COUNTRY, type RequestWithCountry } from '../common/country/country.interceptor'

@Controller('merchants')
export class MerchantsController {
  constructor(
    private readonly merchantsService: MerchantsService,
    private readonly shopMenu: ShopMenuService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryMerchantsDto, @Req() req: RequestWithCountry) {
    const country = query.country ?? req.countryCode ?? DEFAULT_COUNTRY
    return this.merchantsService.findAll({ ...query, country })
  }

  @Public()
  @Get('featured')
  featured(
    @Query('city') city?: string,
    @Query('limit') limit?: string,
    @Query('country') country?: string,
    @Req() req?: RequestWithCountry,
  ) {
    const cc = country ?? req?.countryCode ?? DEFAULT_COUNTRY
    return this.merchantsService.findFeatured(city, limit ? Number(limit) : 6, cc)
  }

  @Public()
  @Get('nearby')
  nearby(
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('limit') limit?: string,
    @Query('country') country?: string,
    @Req() req?: RequestWithCountry,
  ) {
    const cc = country ?? req?.countryCode ?? DEFAULT_COUNTRY
    return this.merchantsService.findNearby(
      city,
      district,
      lat ? Number(lat) : undefined,
      lng ? Number(lng) : undefined,
      radius ? Number(radius) : 2,
      limit ? Number(limit) : 6,
      cc,
    )
  }

  // ── Routes authentifiées avec préfixe fixe (AVANT :slug) ────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('my/all')
  getMyMerchants(@CurrentUser() user: { id: string }) {
    return this.merchantsService.findAllMine(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMyMerchant(
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.findMine(user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  updateMyMerchant(
    @Body() body: {
      business_name?: string; description?: string; phone?: string;
      whatsapp?: string; website?: string; email?: string;
      district?: string; address?: string; city?: string; country?: string;
      latitude?: number | null; longitude?: number | null;
      logo?: string; cover_image?: string;
    },
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.updateMine(body, user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/hours')
  getMyHours(
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.getMyHours(user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/hours')
  updateMyHours(
    @Body() body: { hours: Array<{ day: number; open_time?: string; close_time?: string; is_closed?: boolean }> },
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.updateMyHours(body.hours, user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/media')
  getMyMedia(
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.merchantsService.getMyMedia(user.id, merchantId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/media/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        cb(new BadRequestException('Format accepté : JPEG, PNG ou WebP'), false)
        return
      }
      cb(null, true)
    },
  }))
  uploadMyMedia(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.uploadMyMediaFile(user.id, file, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/media')
  addMyMedia(
    @Body() body: { url: string; type?: string; order?: number },
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.addMyMedia(body, user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/media/:id')
  deleteMyMedia(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.deleteMyMedia(id, user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/media/cover')
  setCoverImage(
    @Body() body: { url: string; field: 'logo' | 'cover_image' },
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.setMyCoverImage(body.url, user.id, body.field, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/analytics')
  getMyAnalytics(
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.getMyAnalytics(user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/analytics/chart')
  getMyAnalyticsChart(
    @CurrentUser() user: { id: string },
    @Query('days') days?: string,
    @Query('event') event?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.getMyAnalyticsChart(
      user.id,
      days ? Number(days) : 30,
      merchantId,
      event ?? 'VIEW',
    )
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/crm')
  getMyCRM(
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.getMyCRM(user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/crm/detail')
  getMyCRMDetail(
    @CurrentUser() user: { id: string },
    @Query('customerId') customerId: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.getMyCRMDetail(user.id, customerId, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/verify-phone/send')
  sendPhoneVerification(
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.sendPhoneVerification(user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/verify-phone/confirm')
  confirmPhoneVerification(
    @Body() body: { code: string },
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.confirmPhoneVerification(user.id, body.code, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/verify-phone/status')
  phoneVerificationStatus(
    @CurrentUser() user: { id: string },
    @Query('merchantId') merchantId?: string,
  ) {
    return this.merchantsService.getPhoneVerificationStatus(user.id, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('register')
  registerMerchant(
    @Body() body: {
      business_name: string; category_slug: string; description?: string;
      phone?: string; whatsapp?: string; address?: string; district?: string; city?: string;
      country_code?: string;
      organization_id?: string;
      create_organization?: { name: string; type: 'CHAIN' | 'GROUP' | 'MULTI_SITE' };
    },
    @CurrentUser() user: { id: string },
  ) {
    return this.merchantsService.registerMerchant(body, user.id)
  }

  // ── Routes publiques avec paramètre dynamique (:slug) ───────────────────────

  @Public()
  @Get(':slug/menu')
  menu(@Param('slug') slug: string) {
    return this.shopMenu.listPublicByMerchantSlug(slug)
  }

  @Public()
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const merchant = await this.merchantsService.findBySlug(slug)
    if (!merchant) throw new NotFoundException(`Merchant "${slug}" not found`)
    return merchant
  }

  @Public()
  @Post(':id/interaction')
  trackInteraction(
    @Param('id') id: string,
    @Body() body: { event_type: string; user_id?: string },
  ) {
    return this.merchantsService.trackInteraction(id, body.event_type, body.user_id)
  }

  @Public()
  @Get(':slug/similar')
  getSimilar(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
  ) {
    return this.merchantsService.findSimilar(slug, limit ? Number(limit) : 4)
  }
}
