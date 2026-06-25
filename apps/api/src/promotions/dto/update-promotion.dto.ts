import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator'
import { PromotionType } from './create-promotion.dto'

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType

  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number

  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsDateString()
  starts_at?: string

  @IsOptional()
  @IsDateString()
  ends_at?: string

  @IsOptional()
  @ValidateIf(o => o.max_uses != null)
  @IsInt()
  @Min(1)
  max_uses?: number | null

  @IsOptional()
  @ValidateIf(o => o.max_uses_per_user != null)
  @IsInt()
  @Min(1)
  max_uses_per_user?: number | null

  @IsOptional()
  @ValidateIf(o => o.min_order_amount != null)
  @IsInt()
  @Min(0)
  min_order_amount?: number | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category_ids?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  product_ids?: string[]

  @IsOptional()
  @IsBoolean()
  is_active?: boolean
}
