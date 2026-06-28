import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { DeliveryVehicle, DeliveryEtaUnit } from '../../../generated/prisma/client'

export class DeliveryZoneRuleDto {
  @IsString()
  city_id!: string

  @IsOptional()
  @IsBoolean()
  all_communes?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  commune_ids?: string[]
}

export class CreateDeliveryZoneDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  @Min(0)
  fee!: number

  @IsOptional()
  @IsInt()
  @Min(0)
  min_order_amount?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  free_delivery_threshold?: number

  @IsInt()
  @Min(1)
  eta_min!: number

  @IsInt()
  @Min(1)
  eta_max!: number

  @IsOptional()
  @IsEnum(DeliveryEtaUnit)
  eta_unit?: DeliveryEtaUnit

  @IsOptional()
  @IsEnum(DeliveryVehicle)
  vehicle?: DeliveryVehicle

  @IsOptional()
  @IsInt()
  priority?: number

  @IsOptional()
  @IsBoolean()
  is_active?: boolean

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliveryZoneRuleDto)
  rules!: DeliveryZoneRuleDto[]
}
