import { IsIn, IsInt, IsString } from 'class-validator'
import { AdPlacement } from '../../../generated/prisma/client'
import { AD_DURATION_OPTIONS } from '../ad-pricing'

export class CreateAdCampaignDto {
  @IsString()
  @IsIn(['SEARCH', 'FEATURED', 'CATEGORY'])
  placement!: AdPlacement

  @IsInt()
  @IsIn([...AD_DURATION_OPTIONS])
  duration_days!: number
}

export class ConfirmAdPaymentDto {
  @IsString()
  paymentId!: string

  @IsString()
  @IsIn(['success', 'failure'])
  simulateResult!: 'success' | 'failure'
}
