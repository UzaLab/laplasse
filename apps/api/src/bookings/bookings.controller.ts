import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Public } from '../auth/decorators/public.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { BookingsService } from './bookings.service'
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto'
import { BookingStatus } from '../../generated/prisma/client'

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly jwt: JwtService,
  ) {}

  @Public()
  @Get('merchant/:merchantId/enabled')
  isEnabled(@Param('merchantId') merchantId: string) {
    return this.bookingsService.merchantBookingEnabled(merchantId)
  }

  @Public()
  @Get('merchant/:merchantId/config')
  getConfig(@Param('merchantId') merchantId: string) {
    return this.bookingsService.getMerchantConfig(merchantId)
  }

  @Public()
  @Get('merchant/:merchantId/availability')
  availability(
    @Param('merchantId') merchantId: string,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
    @Query('staffId') staffId?: string,
  ) {
    return this.bookingsService.getAvailability(merchantId, date, serviceId, staffId)
  }

  @Public()
  @Post('merchant/:merchantId')
  async create(
    @Param('merchantId') merchantId: string,
    @Body() dto: CreateBookingDto,
    @Headers('authorization') authHeader?: string,
  ) {
    let userId: string | undefined
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = await this.jwt.verifyAsync<{ sub: string }>(authHeader.slice(7))
        userId = payload.sub
      } catch {
        userId = undefined
      }
    }
    return this.bookingsService.createForMerchant(merchantId, dto, userId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  myBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.listMyBookings(userId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine/:id/cancel')
  cancelMine(@CurrentUser('id') userId: string, @Param('id') bookingId: string) {
    return this.bookingsService.cancelMyBooking(userId, bookingId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('merchant')
  merchantBookings(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.listMerchantBookings(userId, merchantId, status)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.bookingsService.updateStatus(userId, bookingId, dto, merchantId)
  }
}
