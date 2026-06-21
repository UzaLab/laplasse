import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Public } from '../auth/decorators/public.decorator'
import { NotificationQueueService } from './notification-queue.service'

@Controller('internal/cron')
export class CronController {
  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationQueueService,
  ) {}

  @Public()
  @Post('booking-reminders')
  @HttpCode(HttpStatus.OK)
  async bookingReminders(@Headers('x-cron-secret') secret?: string) {
    const expected = this.config.get<string>('CRON_SECRET')
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Cron non autorisé')
    }
    return this.notifications.processDueBookingReminders()
  }
}
