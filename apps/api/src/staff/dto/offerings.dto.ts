import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'
import { ServiceKind } from '../../../generated/prisma/client'

export class UpdateBookingSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  max_capacity?: number

  @IsOptional()
  @IsInt()
  @Min(15)
  slot_duration_min?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  buffer_min?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  booking_window_days?: number

  @IsOptional()
  @IsBoolean()
  auto_confirm?: boolean
}

export class CreateAvailabilityBlockDto {
  @IsDateString()
  starts_at!: string

  @IsDateString()
  ends_at!: string

  @IsOptional()
  @IsBoolean()
  all_day?: boolean

  @IsOptional()
  @IsString()
  staff_id?: string

  @IsOptional()
  @IsString()
  service_id?: string

  @IsOptional()
  @IsString()
  reason?: string
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
  @Min(1)
  capacity?: number

  @IsOptional()
  @IsString()
  staff_id?: string
}
