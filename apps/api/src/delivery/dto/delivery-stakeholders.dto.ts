import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class LinkShopCourierStaffDto {
  @IsEmail()
  email!: string
}

export class DispatchDeliveryDto {
  @IsOptional()
  @IsIn(['PLATFORM_RIDER', 'MERCHANT_OWN', 'LOGISTICS_PARTNER'])
  fulfilment_mode?: 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'

  @IsOptional()
  @IsString()
  courier_profile_id?: string

  @IsOptional()
  @IsString()
  logistics_partner_id?: string
}

export class RegisterLogisticsPartnerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  legal_name!: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trade_name?: string

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string

  @IsOptional()
  @IsString()
  @MaxLength(4)
  country?: string

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone!: string

  @IsOptional()
  @IsEmail()
  email?: string
}

export class CreateDeliveryContractDto {
  @IsString()
  logistics_partner_id!: string

  @IsOptional()
  fee_override?: number

  @IsOptional()
  sla_eta_max_minutes?: number
}

export class LinkPartnerCourierDto {
  @IsEmail()
  email!: string
}
