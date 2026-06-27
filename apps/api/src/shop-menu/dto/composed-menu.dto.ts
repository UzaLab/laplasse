import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

export class ComposedMenuSlotDto {
  @IsString()
  label: string

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number

  @IsOptional()
  @IsBoolean()
  required?: boolean

  @IsArray()
  @IsString({ each: true })
  item_choices: string[]
}

export class CreateComposedMenuDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  description?: string

  @IsInt()
  @Min(0)
  price: number

  @IsOptional()
  @IsString()
  image_url?: string

  @IsOptional()
  @IsBoolean()
  is_available?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComposedMenuSlotDto)
  slots?: ComposedMenuSlotDto[]
}

export class UpdateComposedMenuDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @IsString()
  image_url?: string

  @IsOptional()
  @IsBoolean()
  is_available?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComposedMenuSlotDto)
  slots?: ComposedMenuSlotDto[]
}
