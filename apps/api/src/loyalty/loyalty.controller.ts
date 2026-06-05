import { Controller, Get } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { LoyaltyService } from './loyalty.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly svc: LoyaltyService) {}

  @Get('my')
  getMyAccount(@CurrentUser('id') userId: string) {
    return this.svc.getAccount(userId)
  }

  @Public()
  @Get('leaderboard')
  getLeaderboard() {
    return this.svc.getLeaderboard(10)
  }
}
