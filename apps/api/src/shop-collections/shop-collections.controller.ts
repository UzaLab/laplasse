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
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ShopCollectionsService } from './shop-collections.service'
import {
  CreateShopCollectionDto,
  ReorderShopCollectionsDto,
  SetCollectionProductsDto,
  UpdateShopCollectionDto,
} from './dto/shop-collection.dto'

@UseGuards(JwtAuthGuard)
@Controller('shop-collections')
export class ShopCollectionsController {
  constructor(private readonly svc: ShopCollectionsService) {}

  @Get('mine')
  listMine(
    @CurrentUser('id') userId: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.svc.listMine(userId, shopId)
  }

  @Get(':id')
  getOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.svc.getMine(userId, id, shopId)
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateShopCollectionDto,
    @Query('shopId') shopId?: string,
  ) {
    return this.svc.create(userId, dto, shopId)
  }

  @Patch('reorder')
  reorder(
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderShopCollectionsDto,
    @Query('shopId') shopId?: string,
  ) {
    return this.svc.reorder(userId, dto, shopId)
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShopCollectionDto,
    @Query('shopId') shopId?: string,
  ) {
    return this.svc.update(userId, id, dto, shopId)
  }

  @Put(':id/products')
  setProducts(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SetCollectionProductsDto,
    @Query('shopId') shopId?: string,
  ) {
    return this.svc.setProducts(userId, id, dto, shopId)
  }

  @Delete(':id')
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('shopId') shopId?: string,
  ) {
    return this.svc.remove(userId, id, shopId)
  }
}
