import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { RolesGuard } from '../auth/guards/roles.guard'
import { UseGuards } from '@nestjs/common'
import { DeliveryService } from './delivery.service'
import { DeliveryJobStatus } from '../../generated/prisma/client'

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly svc: DeliveryService) {}

  @Public()
  @Get('track/:token')
  track(@Param('token') token: string) {
    return this.svc.trackByToken(token)
  }

  @Public()
  @Get('couriers')
  listCouriers(@Query('country') country?: string, @Query('city') city?: string) {
    return this.svc.listCouriers(country, city)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'MERCHANT')
  @Post('orders/:orderId/dispatch')
  dispatch(
    @Param('orderId') orderId: string,
    @Body() body: { courier_id?: string },
  ) {
    return this.svc.dispatchOrder(orderId, body.courier_id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch('jobs/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: DeliveryJobStatus },
  ) {
    return this.svc.updateJobStatus(id, body.status)
  }
}
