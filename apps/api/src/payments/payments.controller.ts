import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { PaymentsService } from './payments.service'
import { ConfirmSubscriptionPaymentDto, InitSubscriptionPaymentDto } from './dto/payment.dto'

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
}
