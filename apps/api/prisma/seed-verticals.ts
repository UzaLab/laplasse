/**
 * Seed données verticales — menu, chambres, prestations, consultations.
 * Un établissement vitrine par type (§6 ROADMAP).
 */

import type { PrismaClient } from '../generated/prisma/client'
import { CATEGORY_BOOKING_CONFIG } from '../src/common/booking-config'
import { FOOD_MENUS, menuImage } from './seed-food-menus'

type SeedCtx = {
  prisma: PrismaClient
  merchantMap: Record<string, string>
  testUserId: string
  productSlugs?: Record<string, string[]>
}

const HOTEL_ROOMS: Record<string, Array<{ name: string; nightly: number; capacity: number }>> = {
  'hotel-ivoire-abidjan': [
    { name: 'Chambre Deluxe Lagune', nightly: 185000, capacity: 2 },
    { name: 'Suite Présidentielle', nightly: 450000, capacity: 4 },
  ],
  'hotel-golf-abidjan': [
    { name: 'Chambre Standard', nightly: 95000, capacity: 2 },
    { name: 'Chambre Vue Golf', nightly: 125000, capacity: 2 },
  ],
  'hotel-siloam-ouaga': [
    { name: 'Chambre Standard', nightly: 55000, capacity: 2 },
    { name: 'Suite Executive', nightly: 95000, capacity: 3 },
  ],
}

const BEAUTY_SERVICES: Record<string, Array<{ name: string; duration: number; price: number; staff?: string }>> = {
  'spa-eden-cocody': [
    { name: 'Massage relaxant 60 min', duration: 60, price: 35000, staff: 'Aïcha Koné' },
    { name: 'Soin visage premium', duration: 45, price: 28000, staff: 'Marie Diallo' },
  ],
  'beaute-divine-yopougon': [
    { name: 'Tresses africaines', duration: 120, price: 15000, staff: 'Fatou Bamba' },
    { name: 'Pose tissage', duration: 90, price: 12000, staff: 'Fatou Bamba' },
  ],
  'fitness-palace-cocody': [
    { name: 'Cours Zumba', duration: 60, price: 5000, staff: 'Coach Koffi' },
    { name: 'Coaching personnel', duration: 60, price: 15000, staff: 'Coach Koffi' },
  ],
  'spa-teranga-dakar': [
    { name: 'Massage relaxant', duration: 60, price: 25000, staff: 'Awa Diagne' },
    { name: 'Manucure', duration: 45, price: 8000, staff: 'Awa Diagne' },
  ],
}

const PHARMACY_SERVICES: Record<string, Array<{ name: string; duration: number; price: number }>> = {
  'pharmacie-riviera-3': [
    { name: 'Consultation pharmaceutique', duration: 20, price: 0 },
    { name: 'Bilan parapharmacie', duration: 30, price: 5000 },
  ],
  'pharmacie-cocody-2-plateaux': [
    { name: 'Conseil ordonnance', duration: 15, price: 0 },
  ],
  'pharmacie-du-faso': [
    { name: 'Consultation pharmaceutique', duration: 20, price: 0 },
  ],
}

async function upsertBookingSettings(
  prisma: PrismaClient,
  merchantId: string,
  opts?: { require_payment?: boolean; deposit_percent?: number },
) {
  await prisma.merchantBookingSettings.upsert({
    where: { merchant_id: merchantId },
    create: {
      merchant_id: merchantId,
      slot_duration_min: 60,
      buffer_min: 15,
      max_capacity: 20,
      booking_window_days: 30,
      require_payment: opts?.require_payment ?? false,
      deposit_percent: opts?.deposit_percent ?? 100,
    },
    update: {
      ...(opts?.require_payment != null ? { require_payment: opts.require_payment } : {}),
      ...(opts?.deposit_percent != null ? { deposit_percent: opts.deposit_percent } : {}),
    },
  })
}

async function seedFoodMenus(prisma: PrismaClient, merchantMap: Record<string, string>) {
  let merchantCount = 0
  let itemCount = 0

  for (const [slug, menu] of Object.entries(FOOD_MENUS)) {
    const merchantId = merchantMap[slug]
    if (!merchantId) continue

    await prisma.menuSection.deleteMany({ where: { merchant_id: merchantId } })
    await prisma.menuItem.deleteMany({ where: { merchant_id: merchantId } })

    let sectionOrder = 0
    for (const section of menu.sections) {
      const sec = await prisma.menuSection.create({
        data: {
          merchant_id: merchantId,
          name: section.name,
          sort_order: sectionOrder++,
        },
      })
      let itemOrder = 0
      for (const item of section.items) {
        await prisma.menuItem.create({
          data: {
            merchant_id: merchantId,
            section_id: sec.id,
            name: item.name,
            description: item.desc ?? null,
            price: item.price,
            image_url: menuImage(item.image),
            sort_order: itemOrder++,
          },
        })
        itemCount++
      }
    }
    merchantCount++
  }

  console.log(`   ↳ ${merchantCount} menus food · ${itemCount} plats (images incluses)`)
}

async function seedLodgingHours(prisma: PrismaClient, merchantMap: Record<string, string>) {
  for (const slug of Object.keys(HOTEL_ROOMS)) {
    const merchantId = merchantMap[slug]
    if (!merchantId) continue
    await prisma.businessHour.deleteMany({ where: { merchant_id: merchantId } })
    for (let day = 0; day < 7; day++) {
      await prisma.businessHour.create({
        data: {
          id: `bh-${slug}-${day}`,
          merchant_id: merchantId,
          day,
          open_time: '00:00',
          close_time: '23:59',
          is_closed: false,
        },
      })
    }
  }
}

async function seedHotelRooms(prisma: PrismaClient, merchantMap: Record<string, string>) {
  for (const [slug, rooms] of Object.entries(HOTEL_ROOMS)) {
    const merchantId = merchantMap[slug]
    if (!merchantId) continue

    await prisma.merchantService.deleteMany({
      where: { merchant_id: merchantId, service_kind: 'ROOM_TYPE' },
    })

    for (const room of rooms) {
      await prisma.merchantService.create({
        data: {
          merchant_id: merchantId,
          name: room.name,
          service_kind: 'ROOM_TYPE',
          duration_min: 1440,
          price: room.nightly,
          nightly_rate: room.nightly,
          capacity: room.capacity,
          description: `Tarif par nuit — ${room.name}`,
        },
      })
    }
    await upsertBookingSettings(prisma, merchantId, { require_payment: true, deposit_percent: 30 })
  }
  await seedLodgingHours(prisma, merchantMap)
}

async function seedBeautyAndFitness(
  prisma: PrismaClient,
  merchantMap: Record<string, string>,
  configs: Record<string, Array<{ name: string; duration: number; price: number; staff?: string }>>,
) {
  for (const [slug, services] of Object.entries(configs)) {
    const merchantId = merchantMap[slug]
    if (!merchantId) continue

    const staffMap = new Map<string, string>()

    for (const svc of services) {
      if (svc.staff && !staffMap.has(svc.staff)) {
        const staff = await prisma.merchantStaff.upsert({
          where: { id: `staff-${slug}-${staffMap.size}` },
          update: { is_active: true },
          create: {
            id: `staff-${slug}-${staffMap.size}`,
            merchant_id: merchantId,
            name: svc.staff,
            is_active: true,
          },
        })
        staffMap.set(svc.staff, staff.id)
      }
    }

    await prisma.merchantService.deleteMany({
      where: { merchant_id: merchantId, service_kind: 'APPOINTMENT' },
    })

    for (const svc of services) {
      await prisma.merchantService.create({
        data: {
          merchant_id: merchantId,
          name: svc.name,
          service_kind: 'APPOINTMENT',
          duration_min: svc.duration,
          price: svc.price,
          staff_id: svc.staff ? staffMap.get(svc.staff) : null,
        },
      })
    }
    await upsertBookingSettings(prisma, merchantId)
  }
}

async function seedPharmacyConsultations(prisma: PrismaClient, merchantMap: Record<string, string>) {
  for (const [slug, services] of Object.entries(PHARMACY_SERVICES)) {
    const merchantId = merchantMap[slug]
    if (!merchantId) continue

    await prisma.merchantService.deleteMany({
      where: { merchant_id: merchantId, service_kind: 'CONSULTATION' },
    })

    for (const svc of services) {
      await prisma.merchantService.create({
        data: {
          merchant_id: merchantId,
          name: svc.name,
          service_kind: 'CONSULTATION',
          duration_min: svc.duration,
          price: svc.price,
        },
      })
    }
    await upsertBookingSettings(prisma, merchantId)
  }
}

async function seedTableBookingMerchants(prisma: PrismaClient, merchantMap: Record<string, string>, catSlugs: Record<string, string>) {
  for (const [slug, merchantId] of Object.entries(merchantMap)) {
    const catSlug = catSlugs[slug]
    if (!catSlug) continue
    const cfg = CATEGORY_BOOKING_CONFIG[catSlug]
    if (cfg?.type === 'TABLE' && cfg.enabled) {
      await upsertBookingSettings(prisma, merchantId)
    }
  }
}

async function seedProductReviews(ctx: SeedCtx) {
  const { prisma, testUserId } = ctx
  const yaleShop = await prisma.shop.findFirst({
    where: { slug: { contains: 'yale' } },
    include: { products: { where: { status: 'ACTIVE' }, take: 2 } },
  })
  if (!yaleShop?.products.length) return

  for (const [i, product] of yaleShop.products.entries()) {
    await prisma.productReview.upsert({
      where: { product_id_user_id: { product_id: product.id, user_id: testUserId } },
      update: { status: i === 0 ? 'APPROVED' : 'PENDING' },
      create: {
        product_id: product.id,
        user_id: testUserId,
        rating: i === 0 ? 5 : 4,
        comment: i === 0 ? 'Qualité exceptionnelle, livraison rapide.' : 'En attente de modération.',
        status: i === 0 ? 'APPROVED' : 'PENDING',
      },
    })
  }
}

export async function seedVerticals(ctx: SeedCtx) {
  const { prisma, merchantMap } = ctx

  // Catégorie par slug marchand (pour booking table)
  const merchants = await prisma.merchant.findMany({
    where: { slug: { in: Object.keys(merchantMap) } },
    select: { slug: true, category: { select: { slug: true } } },
  })
  const catByMerchant: Record<string, string> = {}
  for (const m of merchants) {
    if (m.slug) catByMerchant[m.slug] = m.category.slug
  }

  await seedFoodMenus(prisma, merchantMap)
  await seedHotelRooms(prisma, merchantMap)
  await seedBeautyAndFitness(prisma, merchantMap, BEAUTY_SERVICES)
  await seedPharmacyConsultations(prisma, merchantMap)
  await seedTableBookingMerchants(prisma, merchantMap, catByMerchant)
  await seedProductReviews(ctx)

  console.log('✅ Seed verticals : menus, chambres, prestations, consultations, avis produits')
}
