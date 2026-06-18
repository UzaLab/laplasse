import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
export class ProductVariantInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string

  @IsInt()
  @Min(0)
  price!: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_quantity?: number

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string
}

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  composition?: string

  @IsInt()
  @Min(0)
  price!: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_quantity?: number

  @IsOptional()
  @IsString()
  image_url?: string

  @IsOptional()
  @IsBoolean()
  allow_pickup?: boolean

  @IsOptional()
  @IsBoolean()
  allow_delivery?: boolean

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[]
}

/** DTO explicite — évite les problèmes de whitelist ValidationPipe avec PartialType. */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  composition?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock_quantity?: number

  @IsOptional()
  @IsString()
  image_url?: string

  @IsOptional()
  @IsBoolean()
  allow_pickup?: boolean

  @IsOptional()
  @IsBoolean()
  allow_delivery?: boolean

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[]
}

export class AddCartItemDto {
  @IsString()
  productId!: string

  @IsOptional()
  @IsString()
  variantId?: string

  @IsInt()
  @Min(1)
  quantity!: number
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity!: number
}

export class CheckoutDto {
  @IsIn(['PICKUP', 'DELIVERY'])
  delivery_type!: 'PICKUP' | 'DELIVERY'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  delivery_address?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customer_note?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  customer_phone?: string
}

export class ConfirmOrderPaymentDto {
  @IsString()
  paymentId!: string

  @IsIn(['success', 'failure'])
  simulateResult!: 'success' | 'failure'
}

export class ConfirmBatchOrderPaymentDto {
  @IsArray()
  @IsString({ each: true })
  paymentIds!: string[]

  @IsIn(['success', 'failure'])
  simulateResult!: 'success' | 'failure'
}

export class UpdateOrderStatusDto {
  @IsIn(['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
  status!: 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
}
