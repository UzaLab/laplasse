import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'
import { ServiceKind } from '../../../generated/prisma/client'

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
  @Min(1)
  capacity?: number

  @IsOptional()
  @IsString()
  staff_id?: string
}

export class UpdateStaffDto extends CreateStaffDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean
}
