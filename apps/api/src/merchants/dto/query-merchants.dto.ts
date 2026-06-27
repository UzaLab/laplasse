import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

export class QueryMerchantsDto {
  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  district?: string

  @IsOptional()
  @IsString()
  category?: string

  /** Filtre vertical food : restaurants, fast-food, cafés, bars-lounges */
  @IsOptional()
  @IsIn(['food'])
  vertical?: 'food'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0

  @IsOptional()
  @IsIn(['trust_score', 'created_at', 'business_name'])
  sort?: 'trust_score' | 'created_at' | 'business_name' = 'trust_score'
}
