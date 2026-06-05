import { Controller, Get, Post, Body } from '@nestjs/common'
import { IsString, MinLength } from 'class-validator'
import { ReferralService } from './referral.service'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

class ApplyCodeDto {
  @IsString()
  @MinLength(4)
  code: string
}

@Controller('referral')
export class ReferralController {
  constructor(private readonly svc: ReferralService) {}

  @Get('my-code')
  getMyCode(@CurrentUser('id') userId: string) {
    return this.svc.getOrCreateCode(userId)
  }

  @Get('stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.svc.getStats(userId)
  }

  @Post('apply')
  applyCode(@CurrentUser('id') userId: string, @Body() dto: ApplyCodeDto) {
    return this.svc.applyReferralCode(dto.code, userId)
  }
}
