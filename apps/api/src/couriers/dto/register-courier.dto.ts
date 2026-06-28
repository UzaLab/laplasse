import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { DeliveryVehicle } from '../../../generated/prisma/client'

export class RegisterCourierDto {
  @IsString()
  @MinLength(2)
  city!: string

  @IsString()
  @MinLength(8)
  phone!: string

  @IsOptional()
  @IsString()
  country_code?: string

  @IsOptional()
  @IsEnum(DeliveryVehicle)
  vehicle?: DeliveryVehicle

  @IsOptional()
  @IsString()
  plate_number?: string

  /** Slug partenaire logistique — ex. ref=partner:express-abidjan */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  partner_ref?: string

  /** Slug boutique — ex. ref=shop:ma-boutique */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  shop_ref?: string

  /** Slug établissement — ex. ref=merchant:mon-restaurant */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  merchant_ref?: string
}
