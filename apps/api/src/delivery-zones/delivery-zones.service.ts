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

const FOOD_FALLBACK_FEE = 1500

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
      where: { shop_id: shopId, logistics_partner_id: null },
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

  private buildZoneCreateData(dto: CreateDeliveryZoneDto, owner: { shopId?: string; partnerId?: string }) {
    this.assertRules(dto.rules)
    return {
      shop_id: owner.shopId,
      logistics_partner_id: owner.partnerId,
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
    }
  }

  async createForShop(shopId: string, dto: CreateDeliveryZoneDto) {
    return this.prisma.shopDeliveryZone.create({
      data: this.buildZoneCreateData(dto, { shopId }),
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

  async deleteZoneForPartner(partnerId: string, zoneId: string) {
    const zone = await this.prisma.shopDeliveryZone.findFirst({
      where: { id: zoneId, logistics_partner_id: partnerId },
    })
    if (!zone) throw new NotFoundException('Zone introuvable')
    await this.prisma.shopDeliveryZone.delete({ where: { id: zoneId } })
    return { success: true }
  }

  // ─── Platform delivery rates (réseau LaPlasse) ─────────────────────────────

  async listPlatformRates() {
    return this.prisma.platformDeliveryRate.findMany({
      orderBy: [{ city_id: 'asc' }],
      include: {
        city: { select: { id: true, name: true } },
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
        delivery_fulfilment_default: true,
        shop: {
          select: {
            id: true,
            name: true,
            enabled_modules: true,
            delivery_contracts: {
              where: { status: 'ACTIVE' },
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

      const subtotal = input.subtotals?.[merchantId] ?? 0
      const linkedShop = merchant.shop
      const fulfilmentMode = merchant.delivery_fulfilment_default ?? 'PLATFORM_RIDER'

      // ── MERCHANT_OWN : tarif de zone du marchand (via son shop lié) ──────────
      if (fulfilmentMode === 'MERCHANT_OWN' && linkedShop) {
        const zone = await this.resolveZone(linkedShop.id, input.city_id, input.commune_id)
        if (zone) {
          if (zone.min_order_amount != null && subtotal > 0 && subtotal < zone.min_order_amount) {
            quotes.push({ shop_id: linkedShop.id, merchant_id: merchantId, shop_name: merchant.business_name, available: false, fee: 0, zone_name: zone.name, message: `Commande minimum ${zone.min_order_amount.toLocaleString('fr-FR')} FCFA` })
            continue
          }
          const fee = zone.free_delivery_threshold != null && subtotal >= zone.free_delivery_threshold ? 0 : zone.fee
          quotes.push({ shop_id: linkedShop.id, merchant_id: merchantId, shop_name: merchant.business_name, available: true, fee, zone_name: zone.name, eta_min_minutes: zone.eta_min_minutes, eta_max_minutes: zone.eta_max_minutes, vehicle: zone.vehicle })
          total_delivery_fee += fee
          continue
        }
        // Pas de zone configurée pour flotte dédiée → indisponible
        quotes.push({ shop_id: linkedShop.id, merchant_id: merchantId, shop_name: merchant.business_name, available: false, fee: 0, message: 'Zone de livraison non configurée pour la flotte dédiée' })
        continue
      }

      // ── LOGISTICS_PARTNER : tarif du contrat ou zones du partenaire ──────────
      if (fulfilmentMode === 'LOGISTICS_PARTNER') {
        const contract = linkedShop?.delivery_contracts?.[0]
        if (contract) {
          if (contract.fee_override != null) {
            const fee = subtotal > 0 && input.subtotals != null ? contract.fee_override : contract.fee_override
            quotes.push({ shop_id: linkedShop!.id, merchant_id: merchantId, shop_name: merchant.business_name, available: true, fee, zone_name: 'Prestataire logistique', eta_min_minutes: contract.sla_eta_max_minutes ?? 45, eta_max_minutes: contract.sla_eta_max_minutes ?? 60, vehicle: 'MOTO' })
            total_delivery_fee += fee
            continue
          }
          // Pas de fee_override : cherche les zones du partenaire
          const partnerZone = await this.resolvePartnerZone(contract.logistics_partner_id, input.city_id, input.commune_id)
          if (partnerZone) {
            const fee = partnerZone.free_delivery_threshold != null && subtotal >= partnerZone.free_delivery_threshold ? 0 : partnerZone.fee
            quotes.push({ shop_id: linkedShop!.id, merchant_id: merchantId, shop_name: merchant.business_name, available: true, fee, zone_name: partnerZone.name, eta_min_minutes: partnerZone.eta_min_minutes, eta_max_minutes: partnerZone.eta_max_minutes, vehicle: partnerZone.vehicle })
            total_delivery_fee += fee
            continue
          }
        }
        // Pas de contrat actif → repli plateforme
      }

      // ── PLATFORM_RIDER (défaut) : tarif admin ou fallback 1500 ───────────────
      const platformRate = await this.resolvePlatformRate(input.city_id, input.commune_id)
      if (platformRate) {
        if (platformRate.min_order != null && subtotal > 0 && subtotal < platformRate.min_order) {
          quotes.push({ shop_id: linkedShop?.id ?? merchantId, merchant_id: merchantId, shop_name: merchant.business_name, available: false, fee: 0, zone_name: 'Réseau LaPlasse', message: `Commande minimum ${platformRate.min_order.toLocaleString('fr-FR')} FCFA` })
          continue
        }
        quotes.push({ shop_id: linkedShop?.id ?? merchantId, merchant_id: merchantId, shop_name: merchant.business_name, available: true, fee: platformRate.fee, zone_name: 'Réseau LaPlasse', eta_min_minutes: 30, eta_max_minutes: 45, vehicle: platformRate.vehicle })
        total_delivery_fee += platformRate.fee
        continue
      }

      // Fallback 1500 FCFA
      quotes.push({ shop_id: linkedShop?.id ?? merchantId, merchant_id: merchantId, shop_name: merchant.business_name, available: true, fee: FOOD_FALLBACK_FEE, zone_name: 'Livraison restaurant', eta_min_minutes: 30, eta_max_minutes: 45, vehicle: 'MOTO' })
      total_delivery_fee += FOOD_FALLBACK_FEE
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
