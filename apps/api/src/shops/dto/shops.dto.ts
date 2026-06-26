import {
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
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

  @IsOptional()
  @IsString()
  city_id?: string

  @IsOptional()
  @IsString()
  commune_id?: string

  @IsOptional()
  @IsNumber()
  latitude?: number

  @IsOptional()
  @IsNumber()
  longitude?: number

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
  @IsString()
  city_id?: string

  @IsOptional()
  @IsString()
  commune_id?: string

  @IsOptional()
  latitude?: number

  @IsOptional()
  longitude?: number

  @IsOptional()
  has_physical_location?: boolean

  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED'])
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'SUSPENDED'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabled_modules?: string[]

  @IsOptional()
  @IsIn(['PLATFORM_RIDER', 'MERCHANT_OWN', 'LOGISTICS_PARTNER'])
  delivery_fulfilment_default?: 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'
}

export class LinkShopMerchantDto {
  @IsOptional()
  @IsString()
  merchant_id?: string | null
}

export class SetShopProductCategoriesDto {
  @IsArray()
  @IsString({ each: true })
  category_ids!: string[]
}
