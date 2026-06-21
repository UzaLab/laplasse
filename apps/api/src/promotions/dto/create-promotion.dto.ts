import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  FREE_ITEM = 'FREE_ITEM',
  EARLY_ACCESS = 'EARLY_ACCESS',
  FREE_DELIVERY = 'FREE_DELIVERY',
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

  @IsOptional()
  @IsString()
  shop_id?: string

  @IsOptional()
  @IsString()
  category_id?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  min_order_amount?: number
}
