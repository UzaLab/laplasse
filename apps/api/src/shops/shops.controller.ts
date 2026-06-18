import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ShopsService } from './shops.service'
import { CreateShopDto, LinkShopMerchantDto, UpdateShopDto } from './dto/shops.dto'

@Controller('shops')
export class ShopsController {
  constructor(private readonly svc: ShopsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateShopDto) {
    return this.svc.create(userId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  listMine(@CurrentUser('id') userId: string) {
    return this.svc.listMine(userId)
  }

  @Public()
  @Get(':slug')
  getPublic(@Param('slug') slug: string) {
    return this.svc.getBySlug(slug)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('shopId') shopId: string | undefined,
    @Body() dto: UpdateShopDto,
  ) {
    return this.svc.update(userId, shopId ?? id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/link-merchant')
  linkMerchant(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('shopId') shopId: string | undefined,
    @Body() dto: LinkShopMerchantDto,
  ) {
    return this.svc.linkMerchant(userId, shopId ?? id, dto)
  }
}
