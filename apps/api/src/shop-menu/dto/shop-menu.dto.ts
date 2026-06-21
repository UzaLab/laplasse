import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'

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
}
