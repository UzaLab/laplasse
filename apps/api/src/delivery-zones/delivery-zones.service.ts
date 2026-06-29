import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DeliveryVehicle, Prisma } from '../../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

import { CreateDeliveryZoneDto, DeliveryZoneRuleDto } from './dto/create-delivery-zone.dto'
import { UpdateDeliveryZoneDto } from './dto/update-delivery-zone.dto'
import { DeliveryFulfilmentMode } from '../../generated/prisma/client'

export type DeliveryZoneRuleInput = DeliveryZoneRuleDto
export type { CreateDeliveryZoneDto, UpdateDeliveryZoneDto }

export interface DeliveryQuoteRequest {
  shop_ids?: string[]
  merchant_ids?: string[]
  city_id: string
  commune_id: string
  subtotals?: Record<string, number>
  /** Parcours restaurant : tarif par défaut si aucune zone configurée */
  order_flow?: 'food' | 'marketplace'
  /** Pays ISO-2 pour adapter les frais de livraison par défaut */
  country?: string
}

/** Frais de livraison food par défaut selon le pays (XOF) */
const FOOD_FALLBACK_FEE_BY_COUNTRY: Record<string, number> = {
  CI: 1500,
  BF: 1000,
  SN: 2000,
}
const FOOD_FALLBACK_FEE = 1500

function foodFallbackFee(country?: string | null): number {
  return FOOD_FALLBACK_FEE_BY_COUNTRY[country?.toUpperCase() ?? 'CI'] ?? FOOD_FALLBACK_FEE
}

export interface DeliveryQuoteItem {
  shop_id: string
  merchant_id?: string
  shop_name: string
  available: boolean
  fee: number
  zone_name?: string
  eta_min?: number
  eta_max?: number
  eta_unit?: 'MINUTES' | 'HOURS' | 'DAYS'
  vehicle?: DeliveryVehicle
  message?: string
}

const zoneInclude = {
  rules: {
    include: {
      communes: { select: { commune_id: true } },
      city: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.ShopDeliveryZoneInclude

@Injectable()
export class DeliveryZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForShop(shopId: string) {
    return this.prisma.shopDeliveryZone.findMany({
      where: { shop_id: shopId, logistics_partner_id: null },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: zoneInclude,
    })
  }

  async listForMerchant(merchantId: string) {
    return this.prisma.shopDeliveryZone.findMany({
      where: { merchant_id: merchantId, shop_id: null, logistics_partner_id: null },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: zoneInclude,
    })
  }

  async listForLogisticsPartner(partnerId: string) {
    return this.prisma.shopDeliveryZone.findMany({
      where: { logistics_partner_id: partnerId, shop_id: null },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: zoneInclude,
    })
  }

  private buildZoneCreateData(dto: CreateDeliveryZoneDto, owner: { shopId?: string; merchantId?: string; partnerId?: string }) {
    this.assertRules(dto.rules)
    if (dto.eta_max < dto.eta_min) {
      throw new BadRequestException('Le délai maximum doit être supérieur ou égal au délai minimum')
    }
    return {
      shop_id: owner.shopId,
      merchant_id: owner.merchantId,
      logistics_partner_id: owner.partnerId,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      fee: dto.fee,
      min_order_amount: dto.min_order_amount,
      free_delivery_threshold: dto.free_delivery_threshold,
      eta_min: dto.eta_min,
      eta_max: dto.eta_max,
      eta_unit: dto.eta_unit ?? 'MINUTES',
      vehicle: dto.vehicle ?? 'MOTO',
      priority: dto.priority ?? 0,
      is_active: dto.is_active ?? true,
      rules: {
        create: dto.rules.map(rule => ({
          city_id: rule.city_id,
          all_communes: rule.all_communes ?? false,
          communes: rule.all_communes || !rule.commune_ids?.length
            ? undefined
            : {
                create: rule.commune_ids.map(commune_id => ({ commune_id })),
              },
        })),
      },
    }
  }

  async createForShop(shopId: string, dto: CreateDeliveryZoneDto) {
    return this.prisma.shopDeliveryZone.create({
      data: this.buildZoneCreateData(dto, { shopId }),
      include: zoneInclude,
    })
  }

  async createForMerchant(merchantId: string, dto: CreateDeliveryZoneDto) {
    return this.prisma.shopDeliveryZone.create({
      data: this.buildZoneCreateData(dto, { merchantId }),
      include: zoneInclude,
    })
  }

  async createForLogisticsPartner(partnerId: string, dto: CreateDeliveryZoneDto) {
    return this.prisma.shopDeliveryZone.create({
      data: this.buildZoneCreateData(dto, { partnerId }),
      include: zoneInclude,
    })
  }

  async deleteZone(shopId: string, zoneId: string) {
    const zone = await this.prisma.shopDeliveryZone.findFirst({
      where: { id: zoneId, shop_id: shopId },
    })
    if (!zone) throw new NotFoundException('Zone introuvable')
    await this.prisma.shopDeliveryZone.delete({ where: { id: zoneId } })
    return { success: true }
  }

  async deleteZoneForMerchant(merchantId: string, zoneId: string) {
    const zone = await this.prisma.shopDeliveryZone.findFirst({
      where: { id: zoneId, merchant_id: merchantId },
    })
    if (!zone) throw new NotFoundException('Zone introuvable')
    await this.prisma.shopDeliveryZone.delete({ where: { id: zoneId } })
    return { success: true }
  }

  async deleteZoneForPartner(partnerId: string, zoneId: string) {
    const zone = await this.prisma.shopDeliveryZone.findFirst({
      where: { id: zoneId, logistics_partner_id: partnerId },
    })
    if (!zone) throw new NotFoundException('Zone introuvable')
    await this.prisma.shopDeliveryZone.delete({ where: { id: zoneId } })
    return { success: true }
  }

  async updateForShop(shopId: string, zoneId: string, dto: UpdateDeliveryZoneDto) {
    const zone = await this.prisma.shopDeliveryZone.findFirst({
      where: { id: zoneId, shop_id: shopId, logistics_partner_id: null },
    })
    if (!zone) throw new NotFoundException('Zone introuvable')
    return this.applyZoneUpdate(zoneId, dto)
  }

  async updateForMerchant(merchantId: string, zoneId: string, dto: UpdateDeliveryZoneDto) {
    const zone = await this.prisma.shopDeliveryZone.findFirst({
      where: { id: zoneId, merchant_id: merchantId, logistics_partner_id: null },
    })
    if (!zone) throw new NotFoundException('Zone introuvable')
    return this.applyZoneUpdate(zoneId, dto)
  }

  async updateForPartner(partnerId: string, zoneId: string, dto: UpdateDeliveryZoneDto) {
    const zone = await this.prisma.shopDeliveryZone.findFirst({
      where: { id: zoneId, logistics_partner_id: partnerId, shop_id: null },
    })
    if (!zone) throw new NotFoundException('Zone introuvable')
    return this.applyZoneUpdate(zoneId, dto)
  }

  private async applyZoneUpdate(zoneId: string, dto: UpdateDeliveryZoneDto) {
    if (dto.rules) this.assertRules(dto.rules)
    const etaMin = dto.eta_min ?? undefined
    const etaMax = dto.eta_max ?? undefined
    if (etaMin != null && etaMax != null && etaMax < etaMin) {
      throw new BadRequestException('Le délai maximum doit être supérieur ou égal au délai minimum')
    }

    return this.prisma.$transaction(async tx => {
      if (dto.rules) {
        await tx.shopDeliveryZoneRule.deleteMany({ where: { zone_id: zoneId } })
      }
      return tx.shopDeliveryZone.update({
        where: { id: zoneId },
        data: {
          ...(dto.name != null ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}),
          ...(dto.fee != null ? { fee: dto.fee } : {}),
          ...(dto.min_order_amount !== undefined ? { min_order_amount: dto.min_order_amount } : {}),
          ...(dto.free_delivery_threshold !== undefined
            ? { free_delivery_threshold: dto.free_delivery_threshold }
            : {}),
          ...(dto.eta_min != null ? { eta_min: dto.eta_min } : {}),
          ...(dto.eta_max != null ? { eta_max: dto.eta_max } : {}),
          ...(dto.eta_unit != null ? { eta_unit: dto.eta_unit } : {}),
          ...(dto.vehicle != null ? { vehicle: dto.vehicle } : {}),
          ...(dto.priority != null ? { priority: dto.priority } : {}),
          ...(dto.is_active != null ? { is_active: dto.is_active } : {}),
          ...(dto.rules
            ? {
                rules: {
                  create: dto.rules.map(rule => ({
                    city_id: rule.city_id,
                    all_communes: rule.all_communes ?? false,
                    communes: rule.all_communes || !rule.commune_ids?.length
                      ? undefined
                      : { create: rule.commune_ids.map(commune_id => ({ commune_id })) },
                  })),
                },
              }
            : {}),
        },
        include: zoneInclude,
      })
    })
  }

  // ─── Platform delivery rates (réseau LaPlasse) ─────────────────────────────

  async listPlatformRates(country?: string) {
    const countryCode = country?.toUpperCase()
    return this.prisma.platformDeliveryRate.findMany({
      where: countryCode ? { city: { country: countryCode } } : undefined,
      orderBy: [{ city_id: 'asc' }],
      include: {
        city: { select: { id: true, name: true, country: true } },
        commune: { select: { id: true, name: true } },
      },
    })
  }

  async createPlatformRate(dto: {
    city_id: string
    commune_id?: string
    vehicle?: DeliveryVehicle
    fee: number
    min_order?: number
  }) {
    return this.prisma.platformDeliveryRate.create({
      data: {
        city_id: dto.city_id,
        commune_id: dto.commune_id,
        vehicle: dto.vehicle ?? 'MOTO',
        fee: dto.fee,
        min_order: dto.min_order,
      },
      include: {
        city: { select: { id: true, name: true } },
        commune: { select: { id: true, name: true } },
      },
    })
  }

  async updatePlatformRate(rateId: string, dto: { fee?: number; min_order?: number; is_active?: boolean }) {
    return this.prisma.platformDeliveryRate.update({
      where: { id: rateId },
      data: dto,
    })
  }

  async deletePlatformRate(rateId: string) {
    await this.prisma.platformDeliveryRate.delete({ where: { id: rateId } })
    return { success: true }
  }

  private async resolvePlatformRate(cityId: string, communeId: string) {
    const rate = await this.prisma.platformDeliveryRate.findFirst({
      where: {
        city_id: cityId,
        is_active: true,
        OR: [{ commune_id: communeId }, { commune_id: null }],
      },
      orderBy: { commune_id: 'desc' }, // commune-specific before city-wide
    })
    return rate
  }

  private async resolvePartnerZone(partnerId: string, cityId: string, communeId: string) {
    const zones = await this.prisma.shopDeliveryZone.findMany({
      where: { logistics_partner_id: partnerId, shop_id: null, is_active: true },
      include: zoneInclude,
      orderBy: [{ priority: 'desc' }, { sort_order: 'asc' }],
    })
    const matching = zones.filter(z => z.rules.some(r => this.ruleMatches(r, cityId, communeId)))
    if (!matching.length) return null
    matching.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return this.zoneSpecificity(b) - this.zoneSpecificity(a)
    })
    return matching[0]
  }

  async quote(input: DeliveryQuoteRequest): Promise<{
    quotes: DeliveryQuoteItem[]
    total_delivery_fee: number
  }> {
    if (input.merchant_ids?.length) {
      return this.quoteForMerchants(input)
    }

    const shopIds = input.shop_ids ?? []
    const shops = await this.prisma.shop.findMany({
      where: {
        id: { in: shopIds },
        ...(input.order_flow !== 'food' ? { is_active: true } : {}),
      },
      select: {
        id: true,
        name: true,
        enabled_modules: true,
        delivery_fulfilment_default: true,
        delivery_contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { signed_at: 'desc' },
          take: 1,
          select: {
            logistics_partner_id: true,
            fee_override: true,
            sla_eta_max_minutes: true,
          },
        },
      },
    })
    const shopById = Object.fromEntries(shops.map(s => [s.id, s]))

    const quotes: DeliveryQuoteItem[] = []
    let total_delivery_fee = 0

    for (const shopId of shopIds) {
      const shop = shopById[shopId]
      if (!shop) {
        quotes.push({
          shop_id: shopId,
          shop_name: 'Boutique',
          available: false,
          fee: 0,
          message: 'Boutique introuvable',
        })
        continue
      }

      const quote = await this.resolveFulfilmentQuote({
        fulfilmentMode: shop.delivery_fulfilment_default ?? 'PLATFORM_RIDER',
        shopId: shop.id,
        displayName: shop.name,
        contract: shop.delivery_contracts[0] ?? null,
        cityId: input.city_id,
        communeId: input.commune_id,
        subtotal: input.subtotals?.[shopId] ?? 0,
        country: input.country,
        orderFlow: input.order_flow ?? 'marketplace',
        isFoodCapable: shop.enabled_modules.includes('food'),
      })
      quotes.push(quote)
      if (quote.available) total_delivery_fee += quote.fee
    }

    return { quotes, total_delivery_fee }
  }

  private async quoteForMerchants(input: DeliveryQuoteRequest): Promise<{
    quotes: DeliveryQuoteItem[]
    total_delivery_fee: number
  }> {
    const merchantIds = input.merchant_ids ?? []
    const merchants = await this.prisma.merchant.findMany({
      where: { id: { in: merchantIds }, is_active: true },
      select: {
        id: true,
        business_name: true,
        delivery_fulfilment_default: true,
        delivery_contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { signed_at: 'desc' },
          take: 1,
          select: {
            logistics_partner_id: true,
            fee_override: true,
            sla_eta_max_minutes: true,
          },
        },
        shop: {
          select: {
            id: true,
            name: true,
            enabled_modules: true,
            delivery_contracts: {
              where: { status: 'ACTIVE' },
              orderBy: { signed_at: 'desc' },
              take: 1,
              select: {
                logistics_partner_id: true,
                fee_override: true,
                sla_eta_max_minutes: true,
              },
            },
          },
        },
      },
    })
    const merchantById = Object.fromEntries(merchants.map(m => [m.id, m]))

    const quotes: DeliveryQuoteItem[] = []
    let total_delivery_fee = 0

    for (const merchantId of merchantIds) {
      const merchant = merchantById[merchantId]
      if (!merchant) {
        quotes.push({
          shop_id: merchantId,
          merchant_id: merchantId,
          shop_name: 'Restaurant',
          available: false,
          fee: 0,
          message: 'Restaurant introuvable',
        })
        continue
      }

      const linkedShop = merchant.shop
      const contract = merchant.delivery_contracts[0] ?? linkedShop?.delivery_contracts[0] ?? null
      const quote = await this.resolveFulfilmentQuote({
        fulfilmentMode: merchant.delivery_fulfilment_default ?? 'PLATFORM_RIDER',
        shopId: linkedShop?.id ?? null,
        displayName: merchant.business_name,
        merchantId: merchant.id,
        contract,
        cityId: input.city_id,
        communeId: input.commune_id,
        subtotal: input.subtotals?.[merchantId] ?? 0,
        country: input.country,
        orderFlow: 'food',
        isFoodCapable: true,
      })
      quotes.push(quote)
      if (quote.available) total_delivery_fee += quote.fee
    }

    return { quotes, total_delivery_fee }
  }

  /** Résolution tarif/délai selon le mode d'expédition — source unique food + marketplace. */
  private async resolveFulfilmentQuote(ctx: {
    fulfilmentMode: DeliveryFulfilmentMode
    shopId: string | null
    displayName: string
    merchantId?: string
    contract: {
      logistics_partner_id: string
      fee_override: number | null
      sla_eta_max_minutes: number | null
    } | null
    cityId: string
    communeId: string
    subtotal: number
    country?: string
    orderFlow: 'food' | 'marketplace'
    isFoodCapable: boolean
  }): Promise<DeliveryQuoteItem> {
    const base = {
      shop_id: ctx.shopId ?? ctx.merchantId ?? '',
      merchant_id: ctx.merchantId,
      shop_name: ctx.displayName,
    }

    if (ctx.fulfilmentMode === 'MERCHANT_OWN') {
      if (!ctx.shopId && !ctx.merchantId) {
        return { ...base, available: false, fee: 0, message: 'Configuration requise pour la flotte dédiée' }
      }
      const zone = await this.resolveZone(
        { shopId: ctx.shopId ?? undefined, merchantId: ctx.merchantId },
        ctx.cityId,
        ctx.communeId,
      )
      if (!zone) {
        return {
          ...base,
          available: false,
          fee: 0,
          message: 'Zone de livraison non configurée pour votre flotte',
        }
      }
      return this.quoteFromZone(base, zone, ctx.subtotal)
    }

    if (ctx.fulfilmentMode === 'LOGISTICS_PARTNER') {
      if (!ctx.contract) {
        return {
          ...base,
          available: false,
          fee: 0,
          message: 'Aucun contrat logistique actif. Signez un partenaire ou changez de mode d\'expédition.',
        }
      }
      if (ctx.contract.fee_override != null) {
        const sla = ctx.contract.sla_eta_max_minutes ?? 45
        return {
          ...base,
          available: true,
          fee: ctx.contract.fee_override,
          zone_name: 'Prestataire logistique (forfait contrat)',
          eta_min: sla,
          eta_max: sla,
          eta_unit: 'MINUTES',
          vehicle: 'MOTO',
        }
      }
      const partnerZone = await this.resolvePartnerZone(
        ctx.contract.logistics_partner_id,
        ctx.cityId,
        ctx.communeId,
      )
      if (partnerZone) {
        return this.quoteFromZone(base, partnerZone, ctx.subtotal)
      }
      return {
        ...base,
        available: false,
        fee: 0,
        message: 'Adresse non couverte par les zones de votre partenaire logistique',
      }
    }

    // PLATFORM_RIDER
    const platformRate = await this.resolvePlatformRate(ctx.cityId, ctx.communeId)
    if (platformRate) {
      if (platformRate.min_order != null && ctx.subtotal > 0 && ctx.subtotal < platformRate.min_order) {
        return {
          ...base,
          available: false,
          fee: 0,
          zone_name: 'Réseau LaPlasse',
          message: `Commande minimum ${platformRate.min_order.toLocaleString('fr-FR')} FCFA`,
        }
      }
      return {
        ...base,
        available: true,
        fee: platformRate.fee,
        zone_name: 'Réseau LaPlasse',
        eta_min: 30,
        eta_max: 45,
        eta_unit: 'MINUTES',
        vehicle: platformRate.vehicle,
      }
    }

    if (ctx.orderFlow === 'food' || ctx.isFoodCapable) {
      const fallbackFee = foodFallbackFee(ctx.country ?? null)
      return {
        ...base,
        available: true,
        fee: fallbackFee,
        zone_name: 'Livraison restaurant',
        eta_min: 30,
        eta_max: 45,
        eta_unit: 'MINUTES',
        vehicle: 'MOTO',
      }
    }

    return {
      ...base,
      available: false,
      fee: 0,
      message: 'Livraison indisponible à cette adresse (réseau LaPlasse)',
    }
  }

  private quoteFromZone(
    base: { shop_id: string; merchant_id?: string; shop_name: string },
    zone: {
      name: string
      fee: number
      min_order_amount: number | null
      free_delivery_threshold: number | null
      eta_min: number
      eta_max: number
      eta_unit: 'MINUTES' | 'HOURS' | 'DAYS'
      vehicle: DeliveryVehicle
    },
    subtotal: number,
  ): DeliveryQuoteItem {
    if (zone.min_order_amount != null && subtotal > 0 && subtotal < zone.min_order_amount) {
      return {
        ...base,
        available: false,
        fee: 0,
        zone_name: zone.name,
        message: `Commande minimum ${zone.min_order_amount.toLocaleString('fr-FR')} FCFA`,
      }
    }
    let fee = zone.fee
    if (zone.free_delivery_threshold != null && subtotal >= zone.free_delivery_threshold) {
      fee = 0
    }
    return {
      ...base,
      available: true,
      fee,
      zone_name: zone.name,
      eta_min: zone.eta_min,
      eta_max: zone.eta_max,
      eta_unit: zone.eta_unit,
      vehicle: zone.vehicle,
    }
  }

  applyFreeDelivery(quotes: DeliveryQuoteItem[], shopIds: string[]): DeliveryQuoteItem[] {
    const freeSet = new Set(shopIds)
    return quotes.map(q => {
      if (!q.available || !freeSet.has(q.shop_id)) return q
      return { ...q, fee: 0 }
    })
  }

  recalculateTotal(quotes: DeliveryQuoteItem[]): number {
    return quotes.reduce((sum, q) => sum + (q.available ? q.fee : 0), 0)
  }

  private async resolveZone(owner: { shopId?: string; merchantId?: string }, cityId: string, communeId: string) {
    const where: any = { logistics_partner_id: null, is_active: true }
    if (owner.shopId) where.shop_id = owner.shopId
    else if (owner.merchantId) where.merchant_id = owner.merchantId
    else return null

    const zones = await this.prisma.shopDeliveryZone.findMany({
      where,
      include: zoneInclude,
      orderBy: [{ priority: 'desc' }, { sort_order: 'asc' }],
    })

    const matching = zones.filter(zone =>
      zone.rules.some(rule => this.ruleMatches(rule, cityId, communeId)),
    )

    if (!matching.length) return null

    matching.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      const specA = this.zoneSpecificity(a)
      const specB = this.zoneSpecificity(b)
      return specB - specA
    })

    return matching[0]
  }

  private ruleMatches(
    rule: {
      city_id: string
      all_communes: boolean
      communes: { commune_id: string }[]
    },
    cityId: string,
    communeId: string,
  ) {
    if (rule.city_id !== cityId) return false
    if (rule.all_communes) return true
    return rule.communes.some(c => c.commune_id === communeId)
  }

  private zoneSpecificity(zone: {
    rules: { all_communes: boolean; communes: { commune_id: string }[] }[]
  }) {
    return zone.rules.reduce((sum, rule) => {
      if (rule.all_communes) return sum + 1
      return sum + rule.communes.length
    }, 0)
  }

  private assertRules(rules: DeliveryZoneRuleInput[]) {
    if (!rules.length) {
      throw new BadRequestException('Au moins une règle de couverture est requise')
    }
    for (const rule of rules) {
      if (!rule.city_id) {
        throw new BadRequestException('city_id requis pour chaque règle')
      }
      if (!rule.all_communes && !rule.commune_ids?.length) {
        throw new BadRequestException(
          'Sélectionnez des communes ou activez « toutes les communes »',
        )
      }
    }
  }
}
