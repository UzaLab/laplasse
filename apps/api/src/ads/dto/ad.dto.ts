import { IsIn, IsInt, IsOptional, IsString } from 'class-validator'
import { AdPlacement, AdTargetType } from '../../../generated/prisma/client'
import { AD_DURATION_OPTIONS } from '../ad-pricing'

const PLACEMENTS: AdPlacement[] = [
  'SEARCH',
  'FEATURED',
  'CATEGORY',
  'MARKETPLACE',
  'MARKETPLACE_FEATURED_PRODUCTS',
]

const TARGET_TYPES: AdTargetType[] = ['MERCHANT', 'SHOP', 'PRODUCT']

export class CreateAdCampaignDto {
  @IsOptional()
  @IsIn(TARGET_TYPES)
  target_type?: AdTargetType

  @IsOptional()
  @IsString()
  target_id?: string

  @IsString()
  @IsIn(PLACEMENTS)
  placement!: AdPlacement

  @IsInt()
  @IsIn([...AD_DURATION_OPTIONS])
  duration_days!: number

  /** `immediate` = lancer tout de suite (refusé si emplacement saturé). `waitlist` = file d'attente. */
  @IsOptional()
  @IsIn(['immediate', 'waitlist'])
  mode?: 'immediate' | 'waitlist'
}

export class ConfirmAdPaymentDto {
  @IsString()
  paymentId!: string

  @IsString()
  @IsIn(['success', 'failure'])
  simulateResult!: 'success' | 'failure'
}

export class RecordAdEventDto {
  @IsString()
  campaignId!: string

  @IsString()
  @IsIn(['impression', 'click'])
  event!: 'impression' | 'click'
}
