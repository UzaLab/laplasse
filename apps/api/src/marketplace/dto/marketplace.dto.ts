import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { OrderStatus } from '../../../generated/prisma/client'

export enum ProductVariantKindDto {
  TEXT = 'TEXT',
  COLOR = 'COLOR',
}

export class ProductSpecificationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  value!: string
}

export class ProductAttributeValueDto {
  @IsString()
  attribute_id!: string

  @IsString()
  @MaxLength(500)
  value!: string
}

export class ProductVariantInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string

  @IsOptional()
  @IsEnum(ProductVariantKindDto)
  kind?: ProductVariantKindDto

  @IsOptional()
  @IsString()
  @MaxLength(7)
  color_hex?: string

  @IsOptional()
  @IsString()
  image_url?: string

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

  @IsOptional()
  @IsBoolean()
  is_disabled?: boolean
}

export const PRODUCT_CONDITIONS = ['NEW', 'USED_GOOD', 'USED_FAIR', 'REFURBISHED'] as const
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  NEW: 'Neuf',
  USED_GOOD: 'Occasion — bon état',
  USED_FAIR: 'Occasion — acceptable',
  REFURBISHED: 'Reconditionné',
}

export const PRODUCT_ORIGIN_OPTIONS = ['LOCAL_CI', 'IMPORTED', 'HANDMADE'] as const
export type ProductOrigin = (typeof PRODUCT_ORIGIN_OPTIONS)[number]

export const PRODUCT_ORIGIN_LABELS: Record<ProductOrigin, string> = {
  LOCAL_CI: 'Fabriqué en Côte d\'Ivoire',
  IMPORTED: 'Importé',
  HANDMADE: 'Fait main / artisanat',
}

export class CreateProductDto {
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  short_description?: string

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  composition?: string

  @IsOptional()
  @IsIn([...PRODUCT_CONDITIONS])
  condition?: ProductCondition

  @IsOptional()
  @IsIn([...PRODUCT_ORIGIN_OPTIONS])
  origin?: ProductOrigin

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[]

  @IsOptional()
  @IsInt()
  @Min(0)
  weight_grams?: number

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dimensions?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  preparation_delay_days?: number

  @IsOptional()
  @IsBoolean()
  is_made_to_order?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string

  @IsOptional()
  @IsString()
  @MaxLength(70)
  seo_title?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  seo_description?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  specifications?: ProductSpecificationDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeValueDto)
  attribute_values?: ProductAttributeValueDto[]

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
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsBoolean()
  allow_pickup?: boolean

  @IsOptional()
  @IsBoolean()
  allow_delivery?: boolean

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'])
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[]

  @IsOptional()
  @IsString()
  category_id?: string

  @IsOptional()
  @IsString()
  category_slug?: string
}

/** DTO explicite — évite les problèmes de whitelist ValidationPipe avec PartialType. */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  short_description?: string

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  composition?: string

  @IsOptional()
  @IsIn([...PRODUCT_CONDITIONS])
  condition?: ProductCondition

  @IsOptional()
  @IsIn([...PRODUCT_ORIGIN_OPTIONS])
  origin?: ProductOrigin

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  tags?: string[]

  @IsOptional()
  @IsInt()
  @Min(0)
  weight_grams?: number

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dimensions?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  preparation_delay_days?: number

  @IsOptional()
  @IsBoolean()
  is_made_to_order?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string

  @IsOptional()
  @IsString()
  @MaxLength(70)
  seo_title?: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  seo_description?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  specifications?: ProductSpecificationDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeValueDto)
  attribute_values?: ProductAttributeValueDto[]

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
  @IsArray()
  @IsString({ each: true })
  images?: string[]

  @IsOptional()
  @IsBoolean()
  allow_pickup?: boolean

  @IsOptional()
  @IsBoolean()
  allow_delivery?: boolean

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'])
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED'

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[]

  @IsOptional()
  @IsString()
  category_id?: string

  @IsOptional()
  @IsString()
  category_slug?: string
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

export class AddMenuCartItemDto {
  @IsString()
  menuItemId!: string

  @IsInt()
  @Min(1)
  quantity!: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  optionIds?: string[]
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity!: number
}

export class ApplyCartPromoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  code!: string

  @IsOptional()
  @IsString()
  shop_id?: string
}

export class AppliedPromotionDto {
  @IsString()
  shop_id!: string

  @IsString()
  promotion_id!: string

  @IsString()
  code!: string
}

export class ShopCheckoutDeliveryDto {
  @IsString()
  shop_id!: string

  @IsIn(['PICKUP', 'DELIVERY'])
  delivery_type!: 'PICKUP' | 'DELIVERY'

  @IsOptional()
  @IsString()
  delivery_city_id?: string

  @IsOptional()
  @IsString()
  delivery_commune_id?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  delivery_district?: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  delivery_address_detail?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  delivery_address?: string

  @IsOptional()
  @IsNumber()
  delivery_latitude?: number

  @IsOptional()
  @IsNumber()
  delivery_longitude?: number
}

export class CheckoutDto {
  @IsOptional()
  @IsIn(['PICKUP', 'DELIVERY'])
  delivery_type?: 'PICKUP' | 'DELIVERY'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  delivery_address?: string

  @IsOptional()
  @IsString()
  delivery_city_id?: string

  @IsOptional()
  @IsString()
  delivery_commune_id?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  delivery_district?: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  delivery_address_detail?: string

  @IsOptional()
  @IsNumber()
  delivery_latitude?: number

  @IsOptional()
  @IsNumber()
  delivery_longitude?: number

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customer_note?: string

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  customer_phone!: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppliedPromotionDto)
  applied_promotions?: AppliedPromotionDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopCheckoutDeliveryDto)
  shop_deliveries?: ShopCheckoutDeliveryDto[]

  /** Code promo pour les commandes food (restaurant) */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  food_promo_code?: string

  /** Pré-commande : heure souhaitée ISO8601 (J+1 max). Exemples : "2026-06-27T12:30:00" */
  @IsOptional()
  @IsString()
  preorder_for?: string
}

export class GuestCartItemDto {
  @IsString()
  productId!: string

  @IsOptional()
  @IsString()
  variantId?: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number
}

export class GuestCartPreviewDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  items!: GuestCartItemDto[]
}

export class GuestCheckoutDto extends CheckoutDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  guest_first_name!: string

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  guest_last_name!: string

  @IsOptional()
  @IsBoolean()
  create_account?: boolean

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  cart_items!: GuestCartItemDto[]
}

export class ConfirmOrderPaymentDto {
  @IsString()
  paymentId!: string

  @IsIn(['success', 'failure'])
  simulateResult!: 'success' | 'failure'

  /** Paiement cash à la livraison : le client a le montant exact. */
  @IsOptional()
  @IsBoolean()
  food_cash_exact?: boolean

  /** Montant total des billets que le client présentera (multiples de 10 000 FCFA). */
  @IsOptional()
  @IsInt()
  @Min(1)
  food_cash_tender_amount?: number
}

export class ConfirmBatchOrderPaymentDto {
  @IsArray()
  @IsString({ each: true })
  paymentIds!: string[]

  @IsIn(['success', 'failure'])
  simulateResult!: 'success' | 'failure'

  @IsOptional()
  @IsBoolean()
  food_cash_exact?: boolean

  @IsOptional()
  @IsInt()
  @Min(1)
  food_cash_tender_amount?: number
}

export class UpdateOrderStatusDto {
  @IsIn([
    'PENDING', 'CONFIRMED', 'PREPARING', 'READY',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED',
  ])
  status!: OrderStatus
}

export const ORDER_RETURN_REASONS = [
  'DEFECTIVE',
  'WRONG_ITEM',
  'NOT_RECEIVED',
  'CHANGED_MIND',
  'OTHER',
] as const

export class CreateOrderReturnDto {
  @IsIn([...ORDER_RETURN_REASONS])
  reason!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string
}

export class UpdateOrderReturnDto {
  @IsIn(['APPROVED', 'REJECTED', 'REFUNDED'])
  status!: 'APPROVED' | 'REJECTED' | 'REFUNDED'

  @IsOptional()
  @IsString()
  @MaxLength(500)
  merchant_note?: string
}
