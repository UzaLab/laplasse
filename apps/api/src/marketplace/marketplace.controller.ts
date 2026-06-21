import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { MarketplaceService } from './marketplace.service'
import { ProductCategoriesService } from './product-categories.service'
import {
  AddCartItemDto,
  AddMenuCartItemDto,
  ApplyCartPromoDto,
  CheckoutDto,
  ConfirmBatchOrderPaymentDto,
  ConfirmOrderPaymentDto,
  CreateProductDto,
  UpdateCartItemDto,
  UpdateOrderStatusDto,
  CreateOrderReturnDto,
  UpdateOrderReturnDto,
  UpdateProductDto,
} from './dto/marketplace.dto'
import { OrderStatus, OrderReturnStatus } from '../../generated/prisma/client'
import { DeliveryZonesService } from '../delivery-zones/delivery-zones.service'
import type { DeliveryQuoteRequest } from '../delivery-zones/delivery-zones.service'
import { AddressesService } from '../addresses/addresses.service'
import { CreateUserAddressDto, UpdateUserAddressDto } from '../addresses/dto/user-address.dto'
import { ShopMenuService } from '../shop-menu/shop-menu.service'
import { DEFAULT_COUNTRY, type RequestWithCountry } from '../common/country/country.interceptor'

@Controller()
export class MarketplaceController {
  constructor(
    private readonly svc: MarketplaceService,
    private readonly productCategories: ProductCategoriesService,
    private readonly deliveryZones: DeliveryZonesService,
    private readonly addresses: AddressesService,
    private readonly shopMenu: ShopMenuService,
  ) {}

  @Public()
  @Get('marketplace/product-categories')
  listProductCategories(@Query('country') country?: string) {
    return this.productCategories.listPublicTree(country ?? 'CI')
  }

  @Public()
  @Get('marketplace/featured')
  getFeatured() {
    return this.svc.getFeaturedProducts()
  }

  @Public()
  @Post('checkout/delivery-quote')
  deliveryQuote(@Body() body: DeliveryQuoteRequest) {
    return this.deliveryZones.quote(body)
  }

  @Public()
  @Get('marketplace/products')
  listCatalog(
    @Req() req: RequestWithCountry,
    @Query('q') q?: string,
    @Query('merchant') merchant?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('country') country?: string,
  ) {
    return this.svc.listMarketplaceProducts({
      q,
      merchant,
      category,
      sort,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      country: country ?? req.countryCode ?? DEFAULT_COUNTRY,
    })
  }

  @Public()
  @Get('marketplace/merchants')
  listMerchants(@Query('limit') limit?: string) {
    return this.svc.listMarketplaceMerchants(limit ? Number(limit) : 20)
  }

  @Public()
  @Get('marketplace/spotlight')
  listSpotlight(@Query('limit') limit?: string) {
    return this.svc.listMarketplaceSpotlight(limit ? Number(limit) : undefined)
  }

  @Public()
  @Get('shops/:slug/products')
  listPublicShop(
    @Param('slug') slug: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('collection') collection?: string,
  ) {
    return this.svc.listPublicProducts(slug, { category, q, collection })
  }

  @Public()
  @Get('shops/:slug/collections')
  listPublicShopCollections(@Param('slug') slug: string) {
    return this.svc.listPublicShopCollections(slug)
  }

  @Public()
  @Get('shops/:slug/menu')
  listPublicMenuLegacy(@Param('slug') slug: string) {
    return this.shopMenu.listPublicByMerchantSlug(slug)
  }

  @Public()
  @Get('shops/:slug/product-categories')
  listPublicShopCategories(@Param('slug') slug: string) {
    return this.svc.listPublicShopProductCategories(slug)
  }

  @Public()
  @Get('shops/:slug/products/:productSlug')
  getPublicShop(
    @Param('slug') slug: string,
    @Param('productSlug') productSlug: string,
  ) {
    return this.svc.getPublicProduct(slug, productSlug)
  }

  @Public()
  @Get('merchants/:slug/products')
  listPublic(
    @Param('slug') slug: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('collection') collection?: string,
  ) {
    return this.svc.listPublicProducts(slug, { category, q, collection })
  }

  @Public()
  @Get('merchants/:slug/products/:productSlug')
  getPublic(@Param('slug') slug: string, @Param('productSlug') productSlug: string) {
    return this.svc.getPublicProduct(slug, productSlug)
  }

  @UseGuards(JwtAuthGuard)
  @Get('products/mine')
  listMine(
    @CurrentUser('id') userId: string,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.listMyProducts(userId, shopId ?? merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('products')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.createProduct(userId, dto, shopId ?? merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('products/:id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.updateProduct(userId, id, dto, shopId ?? merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('products/:id')
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.deleteProduct(userId, id, shopId ?? merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('cart')
  getCart(@CurrentUser('id') userId: string) {
    return this.svc.getCart(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart/items')
  addToCart(@CurrentUser('id') userId: string, @Body() dto: AddCartItemDto) {
    return this.svc.addToCart(userId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart/menu-items')
  addMenuItemToCart(
    @CurrentUser('id') userId: string,
    @Body() dto: AddMenuCartItemDto,
  ) {
    return this.svc.addMenuItemToCart(userId, dto.menuItemId, dto.quantity, dto.optionIds)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('cart/items/:itemId')
  updateCartItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.svc.updateCartItem(userId, itemId, dto.quantity)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart')
  clearCart(@CurrentUser('id') userId: string) {
    return this.svc.clearCart(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart/promo/apply')
  applyPromo(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyCartPromoDto,
  ) {
    return this.svc.applyCartPromo(userId, dto.code, dto.shop_id)
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/checkout')
  checkout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.svc.checkout(userId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/pay/confirm')
  confirmPayment(@CurrentUser('id') userId: string, @Body() dto: ConfirmOrderPaymentDto) {
    return this.svc.confirmOrderPayment(userId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/pay/confirm-batch')
  confirmBatchPayment(@CurrentUser('id') userId: string, @Body() dto: ConfirmBatchOrderPaymentDto) {
    return this.svc.confirmBatchOrderPayments(userId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/pay/resume')
  resumePayment(
    @CurrentUser('id') userId: string,
    @Query('orderIds') orderIdsRaw: string,
  ) {
    const orderIds = orderIdsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    return this.svc.resumePendingPayments(userId, orderIds)
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/mine')
  myOrders(@CurrentUser('id') userId: string) {
    return this.svc.listMyOrders(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/merchant/mine')
  merchantOrders(
    @CurrentUser('id') userId: string,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.svc.listMerchantOrders(userId, shopId ?? merchantId, status)
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/merchant/export')
  async exportMerchantOrders(
    @CurrentUser('id') userId: string,
    @Res() res: Response,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
    @Query('days') days?: string,
  ) {
    const parsedDays = days ? Number(days) : 90
    const csv = await this.svc.exportMerchantOrdersCsv(
      userId,
      shopId ?? merchantId,
      Number.isFinite(parsedDays) ? parsedDays : 90,
    )
    const stamp = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="commandes-${stamp}.csv"`)
    res.send(`\uFEFF${csv}`)
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/merchant/returns')
  merchantReturns(
    @CurrentUser('id') userId: string,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
    @Query('status') status?: OrderReturnStatus,
  ) {
    return this.svc.listMerchantReturns(userId, shopId ?? merchantId, status)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('orders/returns/:returnId')
  updateReturn(
    @CurrentUser('id') userId: string,
    @Param('returnId') returnId: string,
    @Body() dto: UpdateOrderReturnDto,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.updateOrderReturn(userId, returnId, dto, shopId ?? merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/returns')
  createReturn(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: CreateOrderReturnDto,
  ) {
    return this.svc.createOrderReturn(userId, orderId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/merchant/analytics')
  merchantShopAnalytics(
    @CurrentUser('id') userId: string,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
    @Query('days') days?: string,
  ) {
    const parsedDays = days ? Number(days) : 30
    return this.svc.getMerchantShopAnalytics(
      userId,
      shopId ?? merchantId,
      Number.isFinite(parsedDays) ? parsedDays : 30,
    )
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/merchant/:orderId')
  merchantOrder(
    @CurrentUser('id') userId: string,
    @Param('orderId') orderId: string,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.getMerchantOrder(userId, orderId, shopId ?? merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/reorder')
  reorderOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.svc.reorderFromOrder(userId, id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  myOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.svc.getMyOrder(userId, id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('orders/:id/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Query('shopId') shopId?: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.updateOrderStatus(userId, id, dto, shopId ?? merchantId)
  }

  // ─── Adresses utilisateur (checkout / paramètres) ───────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('addresses')
  listMyAddresses(@CurrentUser('id') userId: string) {
    return this.addresses.listMine(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('addresses')
  createAddress(@CurrentUser('id') userId: string, @Body() dto: CreateUserAddressDto) {
    return this.addresses.create(userId, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('addresses/:id/default')
  setDefaultAddress(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.addresses.setDefault(userId, id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserAddressDto,
  ) {
    return this.addresses.update(userId, id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('addresses/:id')
  deleteAddress(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.addresses.remove(userId, id)
  }
}
