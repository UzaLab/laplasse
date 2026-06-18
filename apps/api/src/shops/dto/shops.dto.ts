import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateShopDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string

  /** Rattachement optionnel à un établissement existant (même propriétaire). */
  @IsOptional()
  @IsString()
  merchant_id?: string
}

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsString()
  logo?: string

  @IsOptional()
  @IsString()
  cover_image?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'SUSPENDED'])
  status?: 'DRAFT' | 'ACTIVE' | 'SUSPENDED'
}

export class LinkShopMerchantDto {
  @IsOptional()
  @IsString()
  merchant_id?: string | null
}
