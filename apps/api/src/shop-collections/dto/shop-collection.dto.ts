import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateShopCollectionDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  slug?: string
}

export class UpdateShopCollectionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  is_active?: boolean

  @IsOptional()
  @IsInt()
  sort_order?: number
}

export class SetCollectionProductsDto {
  @IsArray()
  @IsString({ each: true })
  product_ids!: string[]
}

export class ReorderShopCollectionsDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[]
}
