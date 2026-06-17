import { IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

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
  @IsIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

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
  @IsIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'
}

export class AddCartItemDto {
  @IsString()
  productId!: string

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

export class UpdateOrderStatusDto {
  @IsIn(['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
  status!: 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
}
