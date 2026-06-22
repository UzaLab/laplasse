import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { PaymentsService } from './payments.service'
import { ConfirmBookingPaymentDto, ConfirmSubscriptionPaymentDto, InitSubscriptionPaymentDto } from './dto/payment.dto'

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('subscribe/init')
  initSubscription(
    @CurrentUser('id') userId: string,
    @Body() dto: InitSubscriptionPaymentDto,
  ) {
    return this.paymentsService.initSubscription(userId, dto.plan, dto.merchantId)
  }

  @Post('subscribe/confirm')
  confirmSubscription(
    @CurrentUser('id') userId: string,
    @Body() dto: ConfirmSubscriptionPaymentDto,
  ) {
    return this.paymentsService.confirmSubscription(userId, dto.paymentId, dto.simulateResult)
  }

  @Get('history')
  history(
    @CurrentUser('id') userId: string,
    @Query('merchantId') merchantId?: string,
  ) {
    return this.paymentsService.getHistory(userId, merchantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:bookingId')
  getBookingPayment(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentsService.getBookingPayment(userId, bookingId)
  }

  @UseGuards(JwtAuthGuard)
  @Post('bookings/:bookingId/confirm')
  confirmBookingPayment(
    @CurrentUser('id') userId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: ConfirmBookingPaymentDto,
  ) {
    return this.paymentsService.confirmBookingPayment(
      userId,
      bookingId,
      dto.paymentId,
      dto.simulateResult,
    )
  }
}
