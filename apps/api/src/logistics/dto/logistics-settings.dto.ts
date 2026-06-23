import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class UpdateLogisticsSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  legal_name?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trade_name?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  rccm_number?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsIn(['1-5', '6-20', '21-100', '100+'])
  fleet_size_range?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicle_types?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commune_ids?: string[]

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  sla_eta_default_minutes?: number

  @IsOptional()
  @IsBoolean()
  auto_dispatch_default?: boolean

  @IsOptional()
  @IsIn(['MTN_MOBILE_MONEY', 'ORANGE_MONEY', 'WAVE', 'BANK'])
  payout_method?: string

  @IsOptional()
  @IsString()
  @MaxLength(40)
  payout_number?: string
}
