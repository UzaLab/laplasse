import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'

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

  @IsInt()
  @Min(15)
  duration_min!: number

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number
}

export class UpdateStaffDto extends CreateStaffDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean
}
