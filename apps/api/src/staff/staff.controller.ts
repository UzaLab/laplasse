import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { StaffService } from './staff.service'
import { CreateStaffDto, CreateServiceDto } from './dto/staff.dto'
import { CreateAvailabilityBlockDto, UpdateBookingSettingsDto } from './dto/offerings.dto'

@Controller('merchants/me')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('booking-settings')
  getBookingSettings(@CurrentUser('id') userId: string, @Query('merchantId') merchantId?: string) {
    return this.staff.getBookingSettings(userId, merchantId)
  }

  @Patch('booking-settings')
  updateBookingSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBookingSettingsDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.updateBookingSettings(userId, dto, merchantId)
  }

  @Get('availability-blocks')
  listBlocks(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.staff.listBlocks(userId, merchantId, from, to)
  }

  @Post('availability-blocks')
  createBlock(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAvailabilityBlockDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.createBlock(userId, dto, merchantId)
  }

  @Delete('availability-blocks/:id')
  deleteBlock(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.deleteBlock(userId, id, merchantId)
  }

  @Get('staff')
  listStaff(@CurrentUser('id') userId: string, @Query('merchantId') merchantId?: string) {
    return this.staff.listStaff(userId, merchantId)
  }

  @Post('staff')
  createStaff(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStaffDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.createStaff(userId, dto, merchantId)
  }

  @Patch('staff/:id')
  updateStaff(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateStaffDto & { is_active: boolean }>,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.updateStaff(userId, id, dto, merchantId)
  }

  @Delete('staff/:id')
  deleteStaff(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.deleteStaff(userId, id, merchantId)
  }

  @Get('services')
  listServices(@CurrentUser('id') userId: string, @Query('merchantId') merchantId?: string) {
    return this.staff.listServices(userId, merchantId)
  }

  @Post('services')
  createService(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateServiceDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.createService(userId, dto, merchantId)
  }

  @Patch('services/:id')
  updateService(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateServiceDto & { is_active: boolean }>,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.updateService(userId, id, dto, merchantId)
  }

  @Delete('services/:id')
  deleteService(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.staff.deleteService(userId, id, merchantId)
  }
}
