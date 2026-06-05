import {
  IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsInt, Min, Max,
} from 'class-validator'

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  FREE_ITEM = 'FREE_ITEM',
  EARLY_ACCESS = 'EARLY_ACCESS',
}

export class CreatePromotionDto {
  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsEnum(PromotionType)
  type: PromotionType

  @IsNumber()
  @Min(0)
  value: number

  @IsOptional()
  @IsString()
  code?: string

  @IsDateString()
  starts_at: string

  @IsDateString()
  ends_at: string

  @IsOptional()
  @IsInt()
  @Min(1)
  max_uses?: number
}
