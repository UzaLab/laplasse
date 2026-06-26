import { IsBoolean, IsIn } from 'class-validator'

const SHOP_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED'] as const
export type AdminShopStatus = (typeof SHOP_STATUSES)[number]

export class UpdateAdminShopStatusDto {
  @IsIn(SHOP_STATUSES)
  status!: AdminShopStatus
}

export class UpdateAdminShopActiveDto {
  @IsBoolean()
  is_active!: boolean
}
