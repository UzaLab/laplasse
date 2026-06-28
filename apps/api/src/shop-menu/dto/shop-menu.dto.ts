import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
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
  @IsString({ each: true })
  allergens?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  item_tags?: string[]

  @IsOptional()
  @IsBoolean()
  contains_alcohol?: boolean

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
  @IsString({ each: true })
  allergens?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  item_tags?: string[]

  @IsOptional()
  @IsBoolean()
  contains_alcohol?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuModifierGroupDto)
  modifier_groups?: MenuModifierGroupDto[]
}

/** Disponibilité restaurant : open, paused (avec durée), closed (sans limite). */
export class UpdateMenuAvailabilityDto {
  @IsIn(['open', 'paused', 'closed'])
  mode: 'open' | 'paused' | 'closed'

  /** Durée de pause en minutes (requis si mode=paused). Valeurs valides : 15, 30, 45, 60. */
  @IsOptional()
  @IsInt()
  @IsIn([15, 30, 45, 60])
  duration_minutes?: number
}

export class UpdateMenuSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  food_prep_minutes?: number

  /** Montant minimum panier (XOF). 0 ou null = pas de minimum. */
  @IsOptional()
  @ValidateIf(o => o.food_min_order_amount != null)
  @IsInt()
  @Min(0)
  food_min_order_amount?: number | null

  /** Paiement cash à la livraison activé pour ce restaurant. */
  @IsOptional()
  @IsBoolean()
  food_accepts_cash?: boolean

  /** Montant max autorisé pour le cash à la livraison (XOF). null = pas de plafond. */
  @IsOptional()
  @ValidateIf(o => o.food_cash_max_amount != null)
  @IsInt()
  @Min(0)
  food_cash_max_amount?: number | null

  /**
   * Horaires d'ouverture JSON.
   * Format : { mon: { open: "11:00", close: "22:00" }, tue: null, ... }
   * null pour un jour = fermé ce jour-là.
   */
  @IsOptional()
  @IsObject()
  food_opening_hours?: Record<string, { open: string; close: string } | null> | null
}
