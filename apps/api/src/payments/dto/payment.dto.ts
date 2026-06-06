import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator'
import { SubscriptionPlan } from '../../../generated/prisma/client'

export class InitSubscriptionPaymentDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan

  @IsOptional()
  @IsString()
  merchantId?: string
}

export class ConfirmSubscriptionPaymentDto {
  @IsString()
  paymentId!: string

  @IsIn(['success', 'failure'])
  simulateResult!: 'success' | 'failure'
}
