import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ShopsService } from './shops.service'
import { CreateShopDto, LinkShopMerchantDto, SetShopProductCategoriesDto, UpdateShopDto } from './dto/shops.dto'
import { DeliveryZonesService } from '../delivery-zones/delivery-zones.service'
import { CreateDeliveryZoneDto } from '../delivery-zones/dto/create-delivery-zone.dto'
import { ShopCourierStaffService } from './shop-courier-staff.service'
import { LogisticsPartnersService } from '../logistics/logistics-partners.service'
import { LinkShopCourierStaffDto, CreateDeliveryContractDto } from '../delivery/dto/delivery-stakeholders.dto'

@Controller('shops')
export class ShopsController {
  constructor(
    private readonly svc: ShopsService,
    private readonly deliveryZones: DeliveryZonesService,
    private readonly courierStaff: ShopCourierStaffService,
    private readonly logistics: LogisticsPartnersService,
  ) {}

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

  @UseGuards(JwtAuthGuard)
  @Get(':shopId/delivery-zones')
  listDeliveryZones(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.deliveryZones.listForShop(shop.id),
    )
  }

  @UseGuards(JwtAuthGuard)
  @Post(':shopId/delivery-zones')
  createDeliveryZone(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Body() dto: CreateDeliveryZoneDto,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.deliveryZones.createForShop(shop.id, dto),
    )
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':shopId/delivery-zones/:zoneId')
  removeDeliveryZone(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Param('zoneId') zoneId: string,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.deliveryZones.deleteZone(shop.id, zoneId),
    )
  }

  @UseGuards(JwtAuthGuard)
  @Get(':shopId/product-categories')
  getProductCategories(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Query('country') country?: string,
  ) {
    return this.svc.getShopProductCategorySelection(userId, shopId, country ?? 'CI')
  }

  @UseGuards(JwtAuthGuard)
  @Put(':shopId/product-categories')
  setProductCategories(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Body() dto: SetShopProductCategoriesDto,
  ) {
    return this.svc.setShopProductCategories(userId, shopId, dto.category_ids)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':shopId/manage')
  getShopForOwner(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
  ) {
    return this.svc.getForOwner(userId, shopId)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':shopId/crm')
  getShopCRM(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
  ) {
    return this.svc.getCRM(userId, shopId)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':shopId/crm/detail')
  getShopCRMDetail(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Query('customerId') customerId: string,
  ) {
    return this.svc.getCRMDetail(userId, shopId, customerId)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':shopId/courier-staff')
  listCourierStaff(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.courierStaff.listForShop(shop.id),
    )
  }

  @UseGuards(JwtAuthGuard)
  @Post(':shopId/courier-staff/link')
  linkCourierStaff(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Body() dto: LinkShopCourierStaffDto,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.courierStaff.linkByEmail(shop.id, dto.email),
    )
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':shopId/courier-staff/:profileId')
  unlinkCourierStaff(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Param('profileId') profileId: string,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.courierStaff.unlink(shop.id, profileId),
    )
  }

  @UseGuards(JwtAuthGuard)
  @Get(':shopId/delivery-contracts')
  listDeliveryContracts(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.logistics.listContractsForShop(shop.id),
    )
  }

  @UseGuards(JwtAuthGuard)
  @Post(':shopId/delivery-contracts')
  createDeliveryContract(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Body() dto: CreateDeliveryContractDto,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.logistics.requestContract(
        shop.id,
        dto.logistics_partner_id,
        dto.fee_override,
        dto.sla_eta_max_minutes,
      ),
    )
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':shopId/delivery-contracts/:contractId/accept')
  acceptDeliveryContract(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
    @Param('contractId') contractId: string,
  ) {
    return this.svc.withOwnerShop(userId, shopId, shop =>
      this.logistics.merchantAcceptContract(shop.id, contractId),
    )
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
