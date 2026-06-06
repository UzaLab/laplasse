import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { OrganizationType } from '../../../generated/prisma/client'

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsEnum(OrganizationType)
  type!: OrganizationType

  @IsOptional()
  @IsString()
  logo?: string
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @IsOptional()
  @IsEnum(OrganizationType)
  type?: OrganizationType

  @IsOptional()
  @IsString()
  logo?: string
}
