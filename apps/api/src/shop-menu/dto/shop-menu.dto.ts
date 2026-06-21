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

export class CreateMenuSectionDto {
  @IsString()
  name: string

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number
}

export class UpdateMenuSectionDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number

  @IsOptional()
  @IsBoolean()
  is_active?: boolean
}

export class MenuModifierOptionDto {
  @IsOptional()
  @IsString()
  id?: string

  @IsString()
  name: string

  @IsOptional()
  @IsInt()
  price_delta?: number

  @IsOptional()
  @IsBoolean()
  is_available?: boolean

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number
}

export class MenuModifierGroupDto {
  @IsOptional()
  @IsString()
  id?: string

  @IsString()
  name: string

  @IsOptional()
  @IsInt()
  @Min(0)
  min_select?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  max_select?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuModifierOptionDto)
  options: MenuModifierOptionDto[]
}

export class CreateMenuItemDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  section_id?: string

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
  @IsInt()
  @Min(0)
  sort_order?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  prep_minutes?: number

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuModifierGroupDto)
  modifier_groups?: MenuModifierGroupDto[]
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  section_id?: string | null

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
  @IsInt()
  @Min(1)
  prep_minutes?: number | null

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuModifierGroupDto)
  modifier_groups?: MenuModifierGroupDto[]
}

export class UpdateMenuSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  food_prep_minutes?: number
}
