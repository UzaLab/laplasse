import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DeliveryVehicle, Prisma } from '../../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

import { CreateDeliveryZoneDto, DeliveryZoneRuleDto } from './dto/create-delivery-zone.dto'

export type DeliveryZoneRuleInput = DeliveryZoneRuleDto
export type { CreateDeliveryZoneDto }

export interface DeliveryQuoteRequest {
  shop_ids?: string[]
  merchant_ids?: string[]
  city_id: string
  commune_id: string
  subtotals?: Record<string, number>
  /** Parcours restaurant : tarif par défaut si aucune zone configurée */
  order_flow?: 'food' | 'marketplace'
}

export interface DeliveryQuoteItem {
  shop_id: string
  merchant_id?: string
  shop_name: string
  available: boolean
  fee: number
  zone_name?: string
  eta_min_minutes?: number
  eta_max_minutes?: number
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
      where: { shop_id: shopId },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: zoneInclude,
    })
  }

  async createForShop(shopId: string, dto: CreateDeliveryZoneDto) {
    this.assertRules(dto.rules)
    return this.prisma.shopDeliveryZone.create({
      data: {
        shop_id: shopId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        fee: dto.fee,
        min_order_amount: dto.min_order_amount,
        free_delivery_threshold: dto.free_delivery_threshold,
        eta_min_minutes: dto.eta_min_minutes,
        eta_max_minutes: dto.eta_max_minutes,
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
      },
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
      select: { id: true, name: true, enabled_modules: true },
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

      const subtotal = input.subtotals?.[shopId] ?? 0
      const zone = await this.resolveZone(shopId, input.city_id, input.commune_id)

      if (!zone) {
        if (input.order_flow === 'food' || shop.enabled_modules.includes('food')) {
          quotes.push({
            shop_id: shopId,
            shop_name: shop.name,
            available: true,
            fee: 1500,
            zone_name: 'Livraison restaurant',
            eta_min_minutes: 30,
            eta_max_minutes: 45,
            vehicle: 'MOTO',
          })
          total_delivery_fee += 1500
          continue
        }
        quotes.push({
          shop_id: shopId,
          shop_name: shop.name,
          available: false,
          fee: 0,
          message: 'Livraison indisponible à cette adresse',
        })
        continue
      }

      if (zone.min_order_amount != null && subtotal > 0 && subtotal < zone.min_order_amount) {
        quotes.push({
          shop_id: shopId,
          shop_name: shop.name,
          available: false,
          fee: 0,
          zone_name: zone.name,
          message: `Commande minimum ${zone.min_order_amount.toLocaleString('fr-FR')} FCFA`,
        })
        continue
      }

      let fee = zone.fee
      if (
        zone.free_delivery_threshold != null
        && subtotal >= zone.free_delivery_threshold
      ) {
        fee = 0
      }

      quotes.push({
        shop_id: shopId,
        shop_name: shop.name,
        available: true,
        fee,
        zone_name: zone.name,
        eta_min_minutes: zone.eta_min_minutes,
        eta_max_minutes: zone.eta_max_minutes,
        vehicle: zone.vehicle,
      })
      total_delivery_fee += fee
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
        shop: { select: { id: true, name: true, enabled_modules: true } },
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

      const subtotal = input.subtotals?.[merchantId] ?? 0
      const linkedShop = merchant.shop

      if (linkedShop) {
        const zone = await this.resolveZone(linkedShop.id, input.city_id, input.commune_id)
        if (zone) {
          if (zone.min_order_amount != null && subtotal > 0 && subtotal < zone.min_order_amount) {
            quotes.push({
              shop_id: linkedShop.id,
              merchant_id: merchantId,
              shop_name: merchant.business_name,
              available: false,
              fee: 0,
              zone_name: zone.name,
              message: `Commande minimum ${zone.min_order_amount.toLocaleString('fr-FR')} FCFA`,
            })
            continue
          }

          let fee = zone.fee
          if (
            zone.free_delivery_threshold != null
            && subtotal >= zone.free_delivery_threshold
          ) {
            fee = 0
          }

          quotes.push({
            shop_id: linkedShop.id,
            merchant_id: merchantId,
            shop_name: merchant.business_name,
            available: true,
            fee,
            zone_name: zone.name,
            eta_min_minutes: zone.eta_min_minutes,
            eta_max_minutes: zone.eta_max_minutes,
            vehicle: zone.vehicle,
          })
          total_delivery_fee += fee
          continue
        }
      }

      quotes.push({
        shop_id: linkedShop?.id ?? merchantId,
        merchant_id: merchantId,
        shop_name: merchant.business_name,
        available: true,
        fee: 1500,
        zone_name: 'Livraison restaurant',
        eta_min_minutes: 30,
        eta_max_minutes: 45,
        vehicle: 'MOTO',
      })
      total_delivery_fee += 1500
    }

    return { quotes, total_delivery_fee }
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

  private async resolveZone(shopId: string, cityId: string, communeId: string) {
    const zones = await this.prisma.shopDeliveryZone.findMany({
      where: { shop_id: shopId, is_active: true },
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
