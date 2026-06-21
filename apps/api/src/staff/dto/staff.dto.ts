import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'
import { ServiceKind } from '../../../generated/prisma/client'

export const MAX_ROOM_IMAGES = 5

export class CreateStaffDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsOptional()
  @IsString()
  role?: string
}

export class CreateServiceDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsOptional()
  service_kind?: ServiceKind

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(15)
  duration_min?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  nightly_rate?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  weekend_nightly_rate?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  peak_nightly_rate?: number

  @IsOptional()
  @IsArray()
  peak_months?: number[]

  @IsOptional()
  @IsInt()
  @Min(1)
  min_stay_nights?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number

  @IsOptional()
  @IsString()
  staff_id?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(MAX_ROOM_IMAGES)
  image_urls?: string[]

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  beds?: number

  @IsOptional()
  @IsString()
  property_type?: string

  @IsOptional()
  @IsString()
  unit_type?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[]
}

export class UpdateStaffDto extends CreateStaffDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean
}
