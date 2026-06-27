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
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ShopMenuService } from './shop-menu.service'
import { ComposedMenuService } from './composed-menu.service'
import {
  CreateMenuItemDto,
  CreateMenuSectionDto,
  UpdateMenuAvailabilityDto,
  UpdateMenuItemDto,
  UpdateMenuSectionDto,
  UpdateMenuSettingsDto,
} from './dto/shop-menu.dto'
import { CreateComposedMenuDto, UpdateComposedMenuDto } from './dto/composed-menu.dto'

@UseGuards(JwtAuthGuard)
@Controller('merchant-menu')
export class ShopMenuController {
  constructor(
    private readonly svc: ShopMenuService,
    private readonly composedSvc: ComposedMenuService,
  ) {}

  @Get('mine')
  listMine(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.listMine(userId, merchantId)
  }

  @Patch('availability')
  updateAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMenuAvailabilityDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.updateAvailability(userId, dto, merchantId)
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMenuSettingsDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.updateSettings(userId, dto, merchantId)
  }

  @Post('sections')
  createSection(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMenuSectionDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.createSection(userId, dto, merchantId)
  }

  @Patch('sections/:id')
  updateSection(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMenuSectionDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.updateSection(userId, id, dto, merchantId)
  }

  @Delete('sections/:id')
  deleteSection(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.deleteSection(userId, id, merchantId)
  }

  @Post('items')
  createItem(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMenuItemDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.createItem(userId, dto, merchantId)
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.updateItem(userId, id, dto, merchantId)
  }

  @Delete('items/:id')
  deleteItem(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.svc.deleteItem(userId, id, merchantId)
  }

  // ── Formules / menus composés ───────────────────────────────────

  @Get('composed-menus')
  listComposedMenus(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.composedSvc.listMine(userId, merchantId)
  }

  @Post('composed-menus')
  createComposedMenu(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateComposedMenuDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.composedSvc.create(userId, dto, merchantId)
  }

  @Patch('composed-menus/:id')
  updateComposedMenu(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateComposedMenuDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.composedSvc.update(userId, id, dto, merchantId)
  }

  @Delete('composed-menus/:id')
  deleteComposedMenu(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.composedSvc.remove(userId, id, merchantId)
  }
}
