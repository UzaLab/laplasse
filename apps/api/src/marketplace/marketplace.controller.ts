import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Public } from '../auth/decorators/public.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { MarketplaceService } from './marketplace.service'
import {
  AddCartItemDto,
  CheckoutDto,
  ConfirmBatchOrderPaymentDto,
  ConfirmOrderPaymentDto,
  CreateProductDto,
  UpdateCartItemDto,
  UpdateOrderStatusDto,
  UpdateProductDto,
} from './dto/marketplace.dto'
import { OrderStatus } from '../../generated/prisma/client'

@Controller()
export class MarketplaceController {
  constructor(private readonly svc: MarketplaceService) {}

  @Public()
  @Get('marketplace/featured')
  getFeatured() {
    return this.svc.getFeaturedProducts()
  }

  @Public()
  @Get('marketplace/products')
  listCatalog(
    @Query('q') q?: string,
    @Query('merchant') merchant?: string,
    @Query('sort') sort?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.svc.listMarketplaceProducts({
      q,
      merchant,
      sort,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
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
  listPublicShop(@Param('slug') slug: string) {
    return this.svc.listPublicProducts(slug)
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
  listPublic(@Param('slug') slug: string) {
    return this.svc.listPublicProducts(slug)
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
}
