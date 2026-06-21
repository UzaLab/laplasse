import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { Public } from '../auth/decorators/public.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { getAccessTokenFromRequest } from '../auth/auth-cookies'
import { BookingsService } from './bookings.service'
import { CreateBookingDto, UpdateBookingStatusDto, UpdateMyBookingDto } from './dto/booking.dto'
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
    @Query('excludeBookingId') excludeBookingId?: string,
  ) {
    return this.bookingsService.getAvailability(merchantId, date, serviceId, staffId, excludeBookingId)
  }

  @Public()
  @Get('merchant/:merchantId/room-calendar')
  roomCalendar(
    @Param('merchantId') merchantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.bookingsService.getRoomCalendar(merchantId, from, to, serviceId)
  }

  @Public()
  @Post('merchant/:merchantId')
  async create(
    @Param('merchantId') merchantId: string,
    @Body() dto: CreateBookingDto,
    @Req() req: Request,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = await this.resolveOptionalUserId(req, authHeader)
    return this.bookingsService.createForMerchant(merchantId, dto, userId)
  }

  /** Utilisateur connecté via cookie httpOnly ou Bearer (endpoint public). */
  private async resolveOptionalUserId(req: Request, authHeader?: string): Promise<string | undefined> {
    const token = getAccessTokenFromRequest(req, authHeader)
    if (!token) return undefined
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token)
      return payload.sub
    } catch {
      return undefined
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  myBookings(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tab') tab?: 'upcoming' | 'history',
  ) {
    return this.bookingsService.listMyBookings(userId, {
      page: Math.max(1, parseInt(page ?? '1', 10) || 1),
      limit: Math.min(20, Math.max(1, parseInt(limit ?? '5', 10) || 5)),
      tab: tab === 'history' ? 'history' : 'upcoming',
    })
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine/:id/cancel')
  cancelMine(@CurrentUser('id') userId: string, @Param('id') bookingId: string) {
    return this.bookingsService.cancelMyBooking(userId, bookingId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mine/:id')
  updateMine(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() dto: UpdateMyBookingDto,
  ) {
    return this.bookingsService.updateMyBooking(userId, bookingId, dto)
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
