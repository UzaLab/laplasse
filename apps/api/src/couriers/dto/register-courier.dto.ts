import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
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
}
