import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateUserAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string

  @IsString()
  city_id!: string

  @IsString()
  commune_id!: string

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  district!: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address_detail?: string

  @IsOptional()
  @IsBoolean()
  is_default?: boolean
}

export class UpdateUserAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string

  @IsOptional()
  @IsString()
  city_id?: string

  @IsOptional()
  @IsString()
  commune_id?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  district?: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address_detail?: string

  @IsOptional()
  @IsBoolean()
  is_default?: boolean
}
