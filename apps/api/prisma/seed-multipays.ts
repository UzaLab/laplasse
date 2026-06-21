/**
 * Seed marchands multi-pays M1 — Burkina Faso & Sénégal.
 */

import type { PrismaClient } from '../generated/prisma/client'

type CatMap = Record<string, { id: string; slug: string }>

type MultipaysCtx = {
  prisma: PrismaClient
  cat: CatMap
  ouagaCityId: string
  dakarCityId: string
}

const BF_MERCHANTS = [
  {
    slug: 'maquis-ouaga-centre',
    name: 'Maquis Le Wassa',
    desc: 'Cuisine ivoirienne et burkinabè au cœur de Ouagadougou. Poisson braisé, riz gras, bissap frais.',
    cat: 'restaurants',
    district: 'Centre',
    address: 'Avenue Kwame Nkrumah',
    lat: 12.3714,
    lng: -1.5197,
    score: 88,
  },
  {
    slug: 'hotel-siloam-ouaga',
    name: 'Hôtel Siloam Ouaga',
    desc: 'Hôtel 4 étoiles avec piscine, restaurant et salles de conférence. Idéal business & tourisme.',
    cat: 'hotels',
    district: 'Koulouba',
    address: 'Quartier Koulouba',
    lat: 12.3789,
    lng: -1.5123,
    score: 91,
  },
  {
    slug: 'boutique-wax-ouaga',
    name: 'Wax & Co Ouagadougou',
    desc: 'Boutique de tissus wax, boubous et accessoires artisanaux du Faso.',
    cat: 'boutiques',
    district: 'Gounghin',
    address: 'Marché Gounghin',
    lat: 12.3650,
    lng: -1.5300,
    score: 82,
  },
  {
    slug: 'pharmacie-du-faso',
    name: 'Pharmacie du Faso',
    desc: 'Pharmacie de référence à Ouagadougou. Parapharmacie, conseil et livraison.',
    cat: 'pharmacies',
    district: 'Zogona',
    address: 'Carrefour Zogona',
    lat: 12.3800,
    lng: -1.5250,
    score: 90,
  },
]

const SN_MERCHANTS = [
  {
    slug: 'restaurant-thieb-dakar',
    name: 'Thieb Dakar',
    desc: 'Le meilleur thiéboudienne de la capitale. Poisson frais, riz parfumé, ambiance conviviale.',
    cat: 'restaurants',
    district: 'Médina',
    address: 'Rue 22, Médina',
    lat: 14.6928,
    lng: -17.4467,
    score: 89,
  },
  {
    slug: 'cafe-almadies',
    name: 'Café des Almadies',
    desc: 'Brunch, café de spécialité et coworking avec vue océan. Ouvert dès 7h.',
    cat: 'cafes',
    district: 'Almadies',
    address: 'Route des Almadies',
    lat: 14.7392,
    lng: -17.5103,
    score: 86,
  },
  {
    slug: 'spa-teranga-dakar',
    name: 'Spa Teranga',
    desc: 'Institut de beauté et spa premium. Massages, soins visage, onglerie.',
    cat: 'beaute',
    district: 'Plateau',
    address: 'Avenue Léopold Sédar Senghor',
    lat: 14.6700,
    lng: -17.4380,
    score: 87,
  },
  {
    slug: 'burger-fast-dakar',
    name: 'Dakar Burger Co',
    desc: 'Burgers artisanaux et livraison rapide sur Dakar. Frites maison, milkshakes.',
    cat: 'fast-food',
    district: 'Yoff',
    address: 'Route de l\'Aéroport, Yoff',
    lat: 14.7510,
    lng: -17.4900,
    score: 83,
  },
]

export async function seedMultipays(ctx: MultipaysCtx) {
  const { prisma, cat } = ctx

  const bfOwner = await prisma.user.upsert({
    where: { email: 'owner.bf@laplasse.bf' },
    update: { role: 'MERCHANT', country: 'BF', city: 'Ouagadougou' },
    create: {
      email: 'owner.bf@laplasse.bf',
      phone: '+22670000001',
      full_name: 'Propriétaire BF Demo',
      role: 'MERCHANT',
      is_verified: true,
      country: 'BF',
      city: 'Ouagadougou',
    },
  })

  const snOwner = await prisma.user.upsert({
    where: { email: 'owner.sn@laplasse.sn' },
    update: { role: 'MERCHANT', country: 'SN', city: 'Dakar' },
    create: {
      email: 'owner.sn@laplasse.sn',
      phone: '+221770000001',
      full_name: 'Propriétaire SN Demo',
      role: 'MERCHANT',
      is_verified: true,
      country: 'SN',
      city: 'Dakar',
    },
  })

  const merchantMap: Record<string, string> = {}

  for (const m of BF_MERCHANTS) {
    const created = await prisma.merchant.upsert({
      where: { slug: m.slug },
      update: { is_active: true },
      create: {
        business_name: m.name,
        slug: m.slug,
        description: m.desc,
        category_id: cat[m.cat].id,
        owner_id: bfOwner.id,
        verification_status: 'VERIFIED',
        trust_score: m.score,
        subscription_plan: 'GROWTH',
        is_active: true,
        cover_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
      },
    })
    await prisma.merchantLocation.upsert({
      where: { merchant_id: created.id },
      update: { country: 'BF', city: 'Ouagadougou', district: m.district, address: m.address, latitude: m.lat, longitude: m.lng },
      create: { merchant_id: created.id, country: 'BF', city: 'Ouagadougou', district: m.district, address: m.address, latitude: m.lat, longitude: m.lng },
    })
    merchantMap[m.slug] = created.id

    if (m.cat === 'boutiques') {
      await prisma.shop.upsert({
        where: { id: `shop_${created.id}` },
        update: { country: 'BF', city: 'Ouagadougou', status: 'ACTIVE', is_active: true },
        create: {
          id: `shop_${created.id}`,
          owner_id: bfOwner.id,
          merchant_id: created.id,
          name: m.name,
          slug: m.slug,
          country: 'BF',
          city: 'Ouagadougou',
          status: 'ACTIVE',
          is_active: true,
        },
      })
    }
  }

  for (const m of SN_MERCHANTS) {
    const created = await prisma.merchant.upsert({
      where: { slug: m.slug },
      update: { is_active: true },
      create: {
        business_name: m.name,
        slug: m.slug,
        description: m.desc,
        category_id: cat[m.cat].id,
        owner_id: snOwner.id,
        verification_status: 'VERIFIED',
        trust_score: m.score,
        subscription_plan: 'GROWTH',
        is_active: true,
        cover_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
      },
    })
    await prisma.merchantLocation.upsert({
      where: { merchant_id: created.id },
      update: { country: 'SN', city: 'Dakar', district: m.district, address: m.address, latitude: m.lat, longitude: m.lng },
      create: { merchant_id: created.id, country: 'SN', city: 'Dakar', district: m.district, address: m.address, latitude: m.lat, longitude: m.lng },
    })
    merchantMap[m.slug] = created.id
  }

  // Catégories produit disponibles BF/SN
  const productCats = await prisma.productCategory.findMany({ where: { is_active: true }, take: 10 })
  for (const code of ['BF', 'SN'] as const) {
    for (const pc of productCats) {
      await prisma.productCategoryCountry.upsert({
        where: { category_id_country_code: { category_id: pc.id, country_code: code } },
        update: {},
        create: { category_id: pc.id, country_code: code },
      })
    }
  }

  console.log(`✅ Seed multi-pays : ${BF_MERCHANTS.length} marchands BF + ${SN_MERCHANTS.length} marchands SN`)
  return merchantMap
}
