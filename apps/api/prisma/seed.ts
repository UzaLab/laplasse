/**
 * LaPlasse — Seed script
 * Popule la base de données avec les données initiales pour le développement.
 * Catégories, utilisateurs de test, 25 marchands Abidjan, reviews.
 */

import 'dotenv/config'
import { hash } from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding LaPlasse database...')

  // ─── CATEGORIES ─────────────────────────────────────────────────────────────

  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'restaurants' }, update: {}, create: { name: 'Gastronomie', slug: 'restaurants', icon: 'UtensilsCrossed', sort_order: 1 } }),
    prisma.category.upsert({ where: { slug: 'bars-lounges' }, update: {}, create: { name: 'Lounge & Rooftop', slug: 'bars-lounges', icon: 'Wine', sort_order: 2 } }),
    prisma.category.upsert({ where: { slug: 'boutiques' }, update: {}, create: { name: 'Concept Stores', slug: 'boutiques', icon: 'Gem', sort_order: 3 } }),
    prisma.category.upsert({ where: { slug: 'beaute' }, update: {}, create: { name: 'Spas & Bien-être', slug: 'beaute', icon: 'Sparkles', sort_order: 4 } }),
    prisma.category.upsert({ where: { slug: 'cafes' }, update: {}, create: { name: 'Cafés & Brunch', slug: 'cafes', icon: 'Coffee', sort_order: 5 } }),
    prisma.category.upsert({ where: { slug: 'hotels' }, update: {}, create: { name: 'Hôtels', slug: 'hotels', icon: 'BedDouble', sort_order: 6 } }),
    prisma.category.upsert({ where: { slug: 'residences' }, update: {}, create: { name: 'Résidences & locations', slug: 'residences', icon: 'Home', sort_order: 10 } }),
    prisma.category.upsert({ where: { slug: 'pharmacies' }, update: {}, create: { name: 'Pharmacies', slug: 'pharmacies', icon: 'Pill', sort_order: 7 } }),
    prisma.category.upsert({ where: { slug: 'fitness' }, update: {}, create: { name: 'Sport & Fitness', slug: 'fitness', icon: 'Dumbbell', sort_order: 8 } }),
    prisma.category.upsert({ where: { slug: 'fast-food' }, update: {}, create: { name: 'Fast Food & Street', slug: 'fast-food', icon: 'Sandwich', sort_order: 9 } }),
  ])

  console.log(`✅ ${categories.length} catégories créées`)

  const cat = Object.fromEntries(categories.map(c => [c.slug, c]))

  // ─── GÉOGRAPHIE CI (Abidjan) ────────────────────────────────────────────────

  for (const row of [
    { code: 'CI', name: "Côte d'Ivoire", latitude: 5.3599517, longitude: -4.0082563 },
    { code: 'BF', name: 'Burkina Faso', latitude: 12.3714277, longitude: -1.5196603 },
    { code: 'SN', name: 'Sénégal', latitude: 14.716677, longitude: -17.467686 },
  ]) {
    await prisma.geoCountry.upsert({
      where: { code: row.code },
      update: { name: row.name, latitude: row.latitude, longitude: row.longitude, is_active: true },
      create: { ...row, is_active: true },
    })
  }

  const abidjan = await prisma.geoCity.upsert({
    where: { country_slug: { country: 'CI', slug: 'abidjan' } },
    update: { is_default: true, is_active: true, latitude: 5.3599517, longitude: -4.0082563 },
    create: {
      country: 'CI',
      name: 'Abidjan',
      slug: 'abidjan',
      is_default: true,
      is_active: true,
      latitude: 5.3599517,
      longitude: -4.0082563,
    },
  })

  const abidjanCommunes = [
    'Cocody', 'Plateau', 'Marcory', 'Yopougon', 'Adjamé', 'Koumassi',
    'Treichville', 'Abobo', 'Port-Bouët', 'Attécoubé', 'Bingerville',
  ]

  for (const name of abidjanCommunes) {
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    await prisma.geoCommune.upsert({
      where: { city_id_slug: { city_id: abidjan.id, slug } },
      update: { is_active: true },
      create: { city_id: abidjan.id, name, slug, is_active: true },
    })
  }

  console.log(`✅ Géo CI : Abidjan + ${abidjanCommunes.length} communes`)

  // ─── GÉOGRAPHIE BF (Ouagadougou) ────────────────────────────────────────────

  const ouaga = await prisma.geoCity.upsert({
    where: { country_slug: { country: 'BF', slug: 'ouagadougou' } },
    update: { is_default: true, is_active: true, latitude: 12.3714277, longitude: -1.5196603 },
    create: {
      country: 'BF',
      name: 'Ouagadougou',
      slug: 'ouagadougou',
      is_default: true,
      is_active: true,
      latitude: 12.3714277,
      longitude: -1.5196603,
    },
  })

  for (const name of ['Centre', 'Cissin', 'Dassasgho', 'Gounghin', 'Koulouba', 'Ouaga 2000', 'Patte d\'Oie', 'Zogona']) {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    await prisma.geoCommune.upsert({
      where: { city_id_slug: { city_id: ouaga.id, slug } },
      update: { is_active: true },
      create: { city_id: ouaga.id, name, slug, is_active: true },
    })
  }

  // ─── GÉOGRAPHIE SN (Dakar) ──────────────────────────────────────────────────

  const dakar = await prisma.geoCity.upsert({
    where: { country_slug: { country: 'SN', slug: 'dakar' } },
    update: { is_default: true, is_active: true, latitude: 14.716677, longitude: -17.467686 },
    create: {
      country: 'SN',
      name: 'Dakar',
      slug: 'dakar',
      is_default: true,
      is_active: true,
      latitude: 14.716677,
      longitude: -17.467686,
    },
  })

  for (const name of ['Plateau', 'Almadies', 'Médina', 'Yoff', 'Parcelles Assainies']) {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    await prisma.geoCommune.upsert({
      where: { city_id_slug: { city_id: dakar.id, slug } },
      update: { is_active: true },
      create: { city_id: dakar.id, name, slug, is_active: true },
    })
  }

  console.log('✅ Géo BF/SN : Ouagadougou + Dakar')

  const bobo = await prisma.geoCity.upsert({
    where: { country_slug: { country: 'BF', slug: 'bobo-dioulasso' } },
    update: { is_active: true },
    create: {
      country: 'BF',
      name: 'Bobo-Dioulasso',
      slug: 'bobo-dioulasso',
      is_default: false,
      is_active: true,
    },
  })

  for (const name of ['Centre', 'Dafra', 'Koko', 'Sarfalao']) {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    await prisma.geoCommune.upsert({
      where: { city_id_slug: { city_id: bobo.id, slug } },
      update: { is_active: true },
      create: { city_id: bobo.id, name, slug, is_active: true },
    })
  }

  console.log('✅ Géo BF : Bobo-Dioulasso')

  // ─── USERS ───────────────────────────────────────────────────────────────────

  const adminPwd    = await hash('Admin2026!', 12)
  const userPwd     = await hash('User2026!', 12)
  const ksoaryPwd   = await hash('Ksoary2026!', 12)
  const bushmanPwd  = await hash('Bushman2026!', 12)
  const yalePwd     = await hash('Yale2026!', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@laplasse.ci' },
    update: { password_hash: adminPwd, role: 'ADMIN', is_verified: true, is_active: true },
    create: { email: 'admin@laplasse.ci', password_hash: adminPwd, full_name: 'Admin LaPlasse', role: 'ADMIN', is_verified: true, is_active: true, city: 'Abidjan', country: 'CI' },
  })

  await prisma.user.upsert({
    where: { email: 'ksouary@gmail.com' },
    update: { password_hash: ksoaryPwd, is_verified: true, is_active: true },
    create: { email: 'ksouary@gmail.com', password_hash: ksoaryPwd, full_name: 'Karim Souary', role: 'USER', is_verified: true, is_active: true, city: 'Abidjan', country: 'CI' },
  })

  // Compte marchand démo (propriétaire de Le Bushman Café)
  const bushmanUser = await prisma.user.upsert({
    where: { email: 'bushman@laplasse.ci' },
    update: { password_hash: bushmanPwd, role: 'MERCHANT', is_verified: true, is_active: true },
    create: { email: 'bushman@laplasse.ci', phone: '+22507000001', password_hash: bushmanPwd, full_name: 'Konan Yao', role: 'MERCHANT', is_verified: true, is_active: true, city: 'Abidjan', country: 'CI' },
  })

  const testUser = await prisma.user.upsert({
    where: { email: 'user@test.ci' },
    update: {},
    create: { email: 'user@test.ci', phone: '+22507999000', full_name: 'Utilisateur Test', role: 'USER', is_verified: true, city: 'Abidjan', country: 'CI' },
  })

  // 25 owners (un par marchand) — plage téléphonique 0800xxxx
  const owners = await Promise.all(
    Array.from({ length: 25 }, (_, i) => i + 1).map(i =>
      prisma.user.upsert({
        where: { email: `owner${i}@laplasse.ci` },
        update: i === 3
          ? { password_hash: yalePwd, role: 'MERCHANT', is_verified: true, is_active: true }
          : {},
        create: {
          email: `owner${i}@laplasse.ci`,
          phone: `+2250800${String(i).padStart(4,'0')}`,
          full_name: `Marchand ${i}`,
          role: 'MERCHANT',
          is_verified: true,
          city: 'Abidjan',
          country: 'CI',
          ...(i === 3 ? { password_hash: yalePwd } : {}),
        },
      })
    )
  )

  console.log('✅ Utilisateurs créés')

  // ─── TAGS ────────────────────────────────────────────────────────────────────

  const tagNames = ['Jazz', 'Rooftop', 'Livraison', 'Réservation', 'Piscine', 'Mode Africaine', 'Artisanat', 'Bio', 'Vue Lagune', 'Privatisable', 'WiFi', 'Terrasse', 'Climatisé', 'Parking', 'Halal', 'Végétarien']
  await Promise.all(tagNames.map(name => prisma.tag.upsert({ where: { name }, update: {}, create: { name } })))

  // ─── MARCHANDS ───────────────────────────────────────────────────────────────

  type MerchantDef = {
    slug: string; name: string; desc: string; cat: string; owner: number;
    cover: string; wa: string; phone: string; email: string;
    status: 'VERIFIED' | 'PENDING' | 'UNVERIFIED'; score: number; sponsored: boolean; plan: string;
    district: string; address: string; lat: number; lng: number;
  }

  const merchantsData: MerchantDef[] = [
    { slug: 'le-bushman-cafe', name: 'Le Bushman Café', desc: "L'adresse incontournable pour une gastronomie africaine moderne dans un cadre jazz & art. Cuisine créative, cocktails signature, live music le vendredi.", cat: 'restaurants', owner: 1, cover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200', wa: '+22507000001', phone: '+22520000001', email: 'contact@bushman.ci', status: 'VERIFIED', score: 95, sponsored: false, plan: 'GROWTH', district: 'Zone 4', address: 'Rue des Jardins, Zone 4', lat: 5.3364, lng: -4.0218 },
    { slug: 'noom-rooftop', name: 'Noom Rooftop', desc: "Bar à cocktails et piscine en plein cœur du Plateau, vue panoramique sur la lagune Ébrié. L'adresse incontournable pour une soirée inoubliable.", cat: 'bars-lounges', owner: 2, cover: 'https://images.unsplash.com/photo-1570554520913-ce219f885e35?auto=format&fit=crop&q=80&w=1200', wa: '+22507000002', phone: '+22520000002', email: 'contact@noom.ci', status: 'VERIFIED', score: 91, sponsored: true, plan: 'PREMIUM', district: 'Plateau', address: 'Avenue Nogues, Le Plateau', lat: 5.3200, lng: -4.0100 },
    { slug: 'yale-design', name: 'Yalé Design', desc: "Concept store de mode ivoirienne contemporaine. Wax, broderies et créateurs locaux sélectionnés avec soin.", cat: 'boutiques', owner: 3, cover: 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&q=80&w=1200', wa: '+22507000003', phone: '+22520000003', email: 'contact@yale.ci', status: 'VERIFIED', score: 88, sponsored: false, plan: 'STARTER', district: 'Cocody Vallons', address: 'Boulevard des Martyrs, Cocody', lat: 5.3600, lng: -3.9900 },
    { slug: 'spa-eden-cocody', name: 'Spa Éden Cocody', desc: "Institut de beauté et spa premium à Cocody. Soins du visage, massages, manucure et pédicure dans un cadre zen. Ouvert 7j/7.", cat: 'beaute', owner: 4, cover: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200', wa: '+22507000004', phone: '+22520000004', email: 'contact@spaeden.ci', status: 'VERIFIED', score: 92, sponsored: false, plan: 'GROWTH', district: 'Cocody', address: "Rue des Jardins, Cocody", lat: 5.3580, lng: -3.9850 },
    { slug: 'cafe-brooklyn-2-plateaux', name: 'Brooklyn Café 2 Plateaux', desc: "Le café brunch incontournable des 2 Plateaux. Pancakes, avocado toast, cold brew et playlist curatée. WiFi haut débit inclus.", cat: 'cafes', owner: 5, cover: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=1200', wa: '+22507000005', phone: '+22520000005', email: 'cafe@brooklyn.ci', status: 'VERIFIED', score: 87, sponsored: true, plan: 'GROWTH', district: '2 Plateaux', address: 'Rue des Jardins, 2 Plateaux', lat: 5.3650, lng: -3.9950 },
    { slug: 'restaurant-le-baobab', name: 'Restaurant Le Baobab', desc: "Cuisine ivoirienne authentique et raffinée. Attiéké poisson grillé, foutou sauce graine, kedjenou de poulet dans un jardin ombragé.", cat: 'restaurants', owner: 6, cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200', wa: '+22507000006', phone: '+22520000006', email: 'contact@baobab.ci', status: 'VERIFIED', score: 89, sponsored: false, plan: 'STARTER', district: 'Marcory', address: 'Rue 12, Marcory Zone 4', lat: 5.3050, lng: -3.9950 },
    { slug: 'hotel-ivoire-abidjan', name: 'Sofitel Abidjan Hôtel Ivoire', desc: "Hôtel 5 étoiles iconique d'Abidjan avec piscine olympique, casino, restaurants gastronomiques et centre de conférences. Vue imprenable sur la lagune.", cat: 'hotels', owner: 7, cover: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200', wa: '+22507000007', phone: '+22520000007', email: 'contact@ivoire.ci', status: 'VERIFIED', score: 98, sponsored: true, plan: 'PREMIUM', district: 'Cocody', address: "Boulevard Hassan II, Cocody", lat: 5.3540, lng: -3.9800 },
    { slug: 'maquis-chez-tantie', name: "Maquis Chez Tantie", desc: "Le vrai maquis abidjanais ! Braiser de poisson frais, alloco, brochettes de viande et la meilleure sauce claire de tout Cocody. Ambiance garantie.", cat: 'restaurants', owner: 8, cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200', wa: '+22507000008', phone: '+22520000008', email: 'tantie@maquis.ci', status: 'VERIFIED', score: 84, sponsored: false, plan: 'FREE', district: 'Cocody Ambassades', address: "Rue de l'Ambassade, Cocody", lat: 5.3500, lng: -3.9700 },
    { slug: 'pharmacie-riviera-3', name: 'Pharmacie Riviera 3', desc: "Pharmacie moderne à Riviera 3, ouverte 24h/24. Large gamme de médicaments, parapharmacie et conseil pharmaceutique personnalisé.", cat: 'pharmacies', owner: 9, cover: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=1200', wa: '+22507000009', phone: '+22520000009', email: 'pharmacie@riviera3.ci', status: 'VERIFIED', score: 90, sponsored: false, plan: 'STARTER', district: 'Riviera 3', address: 'Carrefour Riviera 3', lat: 5.3720, lng: -3.9600 },
    { slug: 'fitness-palace-cocody', name: 'Fitness Palace Cocody', desc: "Salle de sport haut de gamme à Cocody. Musculation, cardio, cours collectifs (Zumba, yoga, HIIT), piscine et coaching personnalisé. Formules flexibles.", cat: 'fitness', owner: 10, cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200', wa: '+22507000010', phone: '+22520000010', email: 'info@fitnesspalace.ci', status: 'VERIFIED', score: 86, sponsored: false, plan: 'GROWTH', district: 'Cocody', address: 'Avenue Franchet d\'Esperey, Cocody', lat: 5.3620, lng: -3.9830 },
    { slug: 'burger-republic-2-plateaux', name: 'Burger Republic 2 Plateaux', desc: "Les meilleurs burgers artisanaux d'Abidjan ! Boeuf Wagyu local, pain brioché maison, frites fraîches. Livraison en 30min sur Cocody et les Plateaux.", cat: 'fast-food', owner: 11, cover: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1200', wa: '+22507000011', phone: '+22520000011', email: 'order@burgerrepublic.ci', status: 'VERIFIED', score: 83, sponsored: false, plan: 'STARTER', district: '2 Plateaux', address: 'Les Vallons, 2 Plateaux', lat: 5.3680, lng: -4.0050 },
    { slug: 'lounge-black-gold', name: 'Black Gold Lounge', desc: "Lounge bar premium à Marcory. Cave à cigares, whisky single malt, cocktails signature inspirés de la culture ivoirienne. Dress code requis.", cat: 'bars-lounges', owner: 12, cover: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=1200', wa: '+22507000012', phone: '+22520000012', email: 'vip@blackgold.ci', status: 'VERIFIED', score: 87, sponsored: false, plan: 'GROWTH', district: 'Marcory', address: 'Avenue Général de Gaulle, Marcory', lat: 5.3100, lng: -3.9990 },
    { slug: 'beaute-divine-yopougon', name: 'Beauté Divine Yopougon', desc: "Salon de coiffure et beauté à Yopougon. Tresses africaines, relaxants, soins capillaires, extension. Équipe de 8 coiffeuses expérimentées.", cat: 'beaute', owner: 13, cover: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200', wa: '+22507000013', phone: '+22520000013', email: 'contact@beautedivine.ci', status: 'VERIFIED', score: 81, sponsored: false, plan: 'FREE', district: 'Yopougon', address: 'Marché de Yopougon', lat: 5.3300, lng: -4.0800 },
    { slug: 'restaurant-chez-wou', name: 'Restaurant Chez Wou', desc: "Cuisine asiatique et fusion à Cocody depuis 2005. Rouleaux de printemps, poulet Kung Pao, sushis frais et dim sum. Réservation conseillée le week-end.", cat: 'restaurants', owner: 14, cover: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&q=80&w=1200', wa: '+22507000014', phone: '+22520000014', email: 'reservation@chezwou.ci', status: 'VERIFIED', score: 85, sponsored: false, plan: 'STARTER', district: 'Cocody', address: 'Rue des Jardins, Cocody', lat: 5.3555, lng: -3.9780 },
    { slug: 'cafe-terrasse-plateau', name: 'Café Terrasse Le Plateau', desc: "Café de travail en plein air au cœur du Plateau. Tables privatives, espresso d'origine, viennoiseries fraîches livrées chaque matin. Idéal meetings & freelances.", cat: 'cafes', owner: 15, cover: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1200', wa: '+22507000015', phone: '+22520000015', email: 'contact@cafeterrasse.ci', status: 'VERIFIED', score: 82, sponsored: false, plan: 'FREE', district: 'Plateau', address: 'Boulevard de la République', lat: 5.3190, lng: -4.0120 },
    { slug: 'galerie-korhogo', name: 'Galerie Korhogo Arts', desc: "Galerie d'art et boutique de souvenirs artisanaux. Masques Senoufo, tissus Kita, bronzes et sculptures signées par des artistes ivoiriens contemporains.", cat: 'boutiques', owner: 16, cover: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200', wa: '+22507010001', phone: '+22520010001', email: 'art@korhogo.ci', status: 'VERIFIED', score: 79, sponsored: false, plan: 'FREE', district: 'Plateau', address: 'Rue du Commerce, Plateau', lat: 5.3220, lng: -4.0080 },
    { slug: 'boulangerie-patisserie-paris', name: "Boulangerie Paris d'Ivoire", desc: "Artisan boulanger français installé à Abidjan depuis 15 ans. Baguettes tradition, croissants pur beurre, gâteaux sur commande. Ouvert dès 6h30.", cat: 'cafes', owner: 17, cover: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200', wa: '+22507010002', phone: '+22520010002', email: 'bonjour@parisdivoire.ci', status: 'VERIFIED', score: 93, sponsored: true, plan: 'GROWTH', district: '2 Plateaux', address: 'Les Vallons, 2 Plateaux', lat: 5.3660, lng: -4.0010 },
    { slug: 'pharmacie-cocody-2-plateaux', name: 'Pharmacie des 2 Plateaux', desc: "Pharmacie de garde aux 2 Plateaux. Médicaments génériques, ordonnances, conseil en phytothérapie. Livraison à domicile disponible.", cat: 'pharmacies', owner: 18, cover: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=1200', wa: '+22507010003', phone: '+22520010003', email: 'pharma@2plateaux.ci', status: 'VERIFIED', score: 88, sponsored: false, plan: 'STARTER', district: '2 Plateaux', address: 'Carrefour Sopim, 2 Plateaux', lat: 5.3700, lng: -4.0020 },
    { slug: 'restaurant-saveurs-du-monde', name: 'Saveurs du Monde', desc: "Restaurant gastronomique multicuisine au Plateau. Chef formé à Paris, carte renouvelée chaque saison. Salle VIP pour événements privés.", cat: 'restaurants', owner: 19, cover: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200', wa: '+22507010004', phone: '+22520010004', email: 'reserv@saveursdumonde.ci', status: 'VERIFIED', score: 91, sponsored: false, plan: 'GROWTH', district: 'Plateau', address: 'Immeuble Alpha 2000, Plateau', lat: 5.3180, lng: -4.0090 },
    { slug: 'hotel-golf-abidjan', name: 'Hôtel Golf Abidjan', desc: "Hôtel de charme au cœur de Cocody, face au Golf Club. 85 chambres, piscine, spa, restaurant gastronomique et terrasse panoramique sur le green.", cat: 'hotels', owner: 20, cover: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&q=80&w=1200', wa: '+22507010005', phone: '+22520010005', email: 'booking@hotelgolf.ci', status: 'VERIFIED', score: 90, sponsored: false, plan: 'PREMIUM', district: 'Cocody', address: 'Avenue du Golf, Cocody', lat: 5.3450, lng: -3.9780 },
    { slug: 'smoothie-bar-riviera', name: 'Green Bowl Riviera', desc: "Bar à smoothies et bowls healthy à Riviera. Fruits frais locaux, açaï, granola maison, smoothies detox. Le paradis des sportifs et healthy addicts.", cat: 'cafes', owner: 21, cover: 'https://images.unsplash.com/photo-1638437447450-609c2f3a5f9a?auto=format&fit=crop&q=80&w=1200', wa: '+22507010006', phone: '+22520010006', email: 'hello@greenbowl.ci', status: 'PENDING', score: 72, sponsored: false, plan: 'FREE', district: 'Riviera 2', address: 'Carrefour Lycée Riviera 2', lat: 5.3680, lng: -3.9650 },
    { slug: 'pizzeria-naples-cocody', name: 'Pizzeria Napoli Cocody', desc: "Pizzeria napolitaine authentique. Pâte fermentée 48h, four à bois, mozzarella di bufala importée. Livraison rapide à Cocody, Plateau et 2 Plateaux.", cat: 'fast-food', owner: 22, cover: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200', wa: '+22507010007', phone: '+22520010007', email: 'pizza@napoli.ci', status: 'VERIFIED', score: 86, sponsored: false, plan: 'STARTER', district: 'Cocody', address: 'Cité des Arts, Cocody', lat: 5.3490, lng: -3.9820 },
    { slug: 'centre-bien-etre-nirvana', name: 'Nirvana Bien-Être', desc: "Centre de méditation, yoga et massages ayurvédiques à Cocody. Retraites de fin de semaine, séances individuelles et cours en groupe. Zen garanti.", cat: 'beaute', owner: 23, cover: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80&w=1200', wa: '+22507010008', phone: '+22520010008', email: 'zen@nirvana.ci', status: 'VERIFIED', score: 89, sponsored: false, plan: 'GROWTH', district: 'Cocody Riviera', address: 'Villa 12, Résidence Riviera', lat: 5.3720, lng: -3.9550 },
    { slug: 'kebab-istanbul-adjame', name: "Istanbul Kebab Adjamé", desc: "Authentic Turkish kebab in the heart of Adjamé. Döner, shawarma, falafel and baklava. Fast service, generous portions, open until midnight.", cat: 'fast-food', owner: 24, cover: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&q=80&w=1200', wa: '+22507010009', phone: '+22520010009', email: 'istanbul@kebab.ci', status: 'PENDING', score: 68, sponsored: false, plan: 'FREE', district: 'Adjamé', address: 'Rue 18, Adjamé', lat: 5.3580, lng: -4.0280 },
    { slug: 'coiffure-glam-treichville', name: 'Glam Coiffure Treichville', desc: "Salon de coiffure afro et coiffures tendance à Treichville. Tresses nattes, vanilles, locks, tissages. Produits naturels certifiés.", cat: 'beaute', owner: 25, cover: 'https://images.unsplash.com/photo-1582095133179-bfd08e2fb6b8?auto=format&fit=crop&q=80&w=1200', wa: '+22507010010', phone: '+22520010010', email: 'glamcoiffure@treichville.ci', status: 'VERIFIED', score: 76, sponsored: false, plan: 'FREE', district: 'Treichville', address: 'Avenue 13, Treichville', lat: 5.2960, lng: -4.0090 },
  ]

  let merchantCount = 0
  const merchantMap: Record<string, string> = {}

  for (const m of merchantsData) {
    const owner = owners[(m.owner - 1) % owners.length]
    const created = await prisma.merchant.upsert({
      where: { slug: m.slug },
      update: {},
      create: {
        business_name: m.name,
        slug: m.slug,
        description: m.desc,
        category_id: cat[m.cat].id,
        owner_id: owner.id,
        cover_image: m.cover,
        whatsapp: m.wa,
        phone: m.phone,
        email: m.email,
        verification_status: m.status,
        trust_score: m.score,
        subscription_plan: m.plan as 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM',
        is_active: true,
        is_sponsored: m.sponsored,
      },
    })

    await prisma.merchantLocation.upsert({
      where: { merchant_id: created.id },
      update: {},
      create: { merchant_id: created.id, country: 'CI', city: 'Abidjan', district: m.district, address: m.address, latitude: m.lat, longitude: m.lng },
    })

    merchantMap[m.slug] = created.id
    merchantCount++
  }

  console.log(`✅ ${merchantCount} marchands créés`)

  // Forcer bushman@laplasse.ci comme propriétaire de Le Bushman Café
  if (merchantMap['le-bushman-cafe']) {
    await prisma.merchant.update({
      where: { id: merchantMap['le-bushman-cafe'] },
      data: { owner_id: bushmanUser.id },
    })
  }

  // ─── HORAIRES (Bushman + quelques autres) ────────────────────────────────────

  const hoursData: { slug: string; schedule: { days: number[]; open: string; close: string }[] }[] = [
    { slug: 'le-bushman-cafe',        schedule: [{ days:[1,2,3,4,5,6], open:'12:00', close:'23:00' }] },
    { slug: 'noom-rooftop',           schedule: [{ days:[0,1,2,3,4,5,6], open:'18:00', close:'02:00' }] },
    { slug: 'spa-eden-cocody',        schedule: [{ days:[0,1,2,3,4,5,6], open:'09:00', close:'20:00' }] },
    { slug: 'cafe-brooklyn-2-plateaux', schedule: [{ days:[0,1,2,3,4,5,6], open:'07:30', close:'22:00' }] },
    { slug: 'burger-republic-2-plateaux', schedule: [{ days:[0,1,2,3,4,5,6], open:'11:00', close:'23:30' }] },
    { slug: 'pharmacie-riviera-3',    schedule: [{ days:[0,1,2,3,4,5,6], open:'00:00', close:'23:59' }] },
    { slug: 'hotel-ivoire-abidjan',   schedule: [{ days:[0,1,2,3,4,5,6], open:'00:00', close:'23:59' }] },
    { slug: 'hotel-golf-abidjan',     schedule: [{ days:[0,1,2,3,4,5,6], open:'00:00', close:'23:59' }] },
    { slug: 'beaute-divine-yopougon', schedule: [{ days:[0,1,2,3,4,5,6], open:'09:00', close:'20:00' }] },
    { slug: 'fitness-palace-cocody',  schedule: [{ days:[0,1,2,3,4,5,6], open:'06:00', close:'22:00' }] },
    { slug: 'pharmacie-cocody-2-plateaux', schedule: [{ days:[0,1,2,3,4,5,6], open:'08:00', close:'22:00' }] },
    { slug: 'boulangerie-patisserie-paris', schedule: [{ days:[0,1,2,3,4,5,6], open:'06:30', close:'20:00' }] },
  ]

  for (const { slug, schedule } of hoursData) {
    const mId = merchantMap[slug]
    if (!mId) continue
    await prisma.businessHour.deleteMany({ where: { merchant_id: mId } })
    for (let day = 0; day < 7; day++) {
      const match = schedule.find(s => s.days.includes(day))
      await prisma.businessHour.create({
        data: {
          id: `bh-${slug}-${day}`,
          merchant_id: mId,
          day,
          open_time: match?.open ?? null,
          close_time: match?.close ?? null,
          is_closed: !match,
        },
      })
    }
  }

  console.log('✅ Horaires créés')

  // ─── REVIEWS ─────────────────────────────────────────────────────────────────

  const reviewsData = [
    { slug: 'le-bushman-cafe',  rating: 5, title: 'Une expérience inoubliable', content: "Le Bushman, c'est le summum de la cuisine africaine moderne. Le cadre est magnifique, le personnel aux petits soins, et les plats... un voyage gustatif !" },
    { slug: 'noom-rooftop',     rating: 5, title: 'Vue imprenable sur la lagune', content: "Noom Rooftop offre une vue exceptionnelle. Les cocktails sont délicieux et l'ambiance est parfaite pour une soirée entre amis." },
    { slug: 'yale-design',      rating: 5, title: 'La mode ivoirienne à son meilleur', content: "Yalé Design est un trésor. Des créations uniques qui valorisent le savoir-faire ivoirien." },
    { slug: 'spa-eden-cocody',  rating: 5, title: 'Détente absolue', content: "Massage exceptionnel, personnel très professionnel. Je repars ressourcée à chaque visite. Mon adresse bien-être préférée d'Abidjan." },
    { slug: 'cafe-brooklyn-2-plateaux', rating: 4, title: 'Le meilleur brunch de Cocody', content: "Parfait pour travailler le matin. WiFi rapide, café excellent, pancakes incroyables. Un peu de monde le weekend." },
    { slug: 'restaurant-le-baobab', rating: 4, title: 'Cuisine ivoirienne top', content: "Enfin un resto qui fait honneur à notre cuisine ! Le foutou sauce graine est divin. Prix raisonnables, cadre agréable." },
    { slug: 'hotel-ivoire-abidjan', rating: 5, title: 'Hôtel de légende', content: "L'Ivoire c'est Abidjan. Que ce soit pour le restaurant gastronomique ou la piscine olympique, c'est toujours une expérience d'exception." },
    { slug: 'boulangerie-patisserie-paris', rating: 5, title: 'La vraie boulangerie française !', content: "Croissants pur beurre, baguette tradition croustillante... On se croirait à Paris ! Ouvert tôt le matin, parfait pour les lève-tôt." },
    { slug: 'burger-republic-2-plateaux', rating: 4, title: 'Burgers de qualité', content: "Le meilleur burger de la ville sans hésitation. La viande est tendre, les sauces maison excellentes. Livraison ponctuelle." },
    { slug: 'fitness-palace-cocody', rating: 4, title: 'Salle bien équipée', content: "Équipements récents, coachs compétents, cours de Zumba top ! La piscine est un vrai plus. Abonnement mensuel accessible." },
  ]

  await Promise.all(reviewsData.map(r => {
    const mId = merchantMap[r.slug]
    if (!mId) return Promise.resolve()
    return prisma.review.createMany({
      skipDuplicates: true,
      data: [{ merchant_id: mId, user_id: testUser.id, rating: r.rating, title: r.title, content: r.content, status: 'APPROVED' }],
    })
  }))

  console.log('✅ Reviews créées')

  // ─── VERIFICATIONS ───────────────────────────────────────────────────────────

  const verifiedSlugs = merchantsData.filter(m => m.status === 'VERIFIED').map(m => m.slug)
  for (const slug of verifiedSlugs) {
    const mId = merchantMap[slug]
    if (!mId) continue
    await prisma.merchantVerification.createMany({
      skipDuplicates: true,
      data: [{ merchant_id: mId, verification_type: 'PHONE', status: 'approved', verified_by: adminUser.id, verified_at: new Date() }],
    })
  }

  console.log('✅ Vérifications créées')

  // ─── PRODUCT CATEGORIES (marketplace) ───────────────────────────────────────

  const { seedProductCategories } = await import('./seed-product-categories')
  const pcStats = await seedProductCategories(prisma)
  console.log(`✅ Catégories produit marketplace (${pcStats.total} entrées)`)

  // ─── MARKETPLACE PRODUCTS (boutiques) ────────────────────────────────────────

  const boutiqueProducts: Array<{ merchantSlug: string; products: Array<{ name: string; slug: string; price: number; stock: number; image: string; desc: string }> }> = [
    {
      merchantSlug: 'yale-design',
      products: [
        { name: 'Robe Wax Élégance', slug: 'robe-wax-elegance', price: 45000, stock: 12, image: 'https://images.unsplash.com/photo-1594633312681-425a7b9569e2?auto=format&fit=crop&q=80&w=800', desc: 'Robe en wax premium, coupe moderne.' },
        { name: 'Sac Tissé Main', slug: 'sac-tisse-main', price: 28000, stock: 8, image: 'https://images.unsplash.com/photo-1590875127128-5de792a5c2a8?auto=format&fit=crop&q=80&w=800', desc: 'Sac artisanal tissé à la main.' },
        { name: 'Boubou Homme Premium', slug: 'boubou-homme-premium', price: 65000, stock: 5, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800', desc: 'Boubou brodé, finitions soignées.' },
      ],
    },
    {
      merchantSlug: 'galerie-korhogo',
      products: [
        { name: 'Masque Senoufo', slug: 'masque-senoufo', price: 85000, stock: 3, image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800', desc: 'Masque traditionnel authentique.' },
        { name: 'Tissu Kita', slug: 'tissu-kita', price: 35000, stock: 15, image: 'https://images.unsplash.com/photo-1558171818-61854a5d1d4f?auto=format&fit=crop&q=80&w=800', desc: 'Tissu Kita 6 yards, motifs géométriques.' },
        { name: 'Bronze Baoulé', slug: 'bronze-baoule', price: 120000, stock: 2, image: 'https://images.unsplash.com/photo-1578749556568-bc2c40f68d55?auto=format&fit=crop&q=80&w=800', desc: 'Sculpture bronze signée artiste local.' },
      ],
    },
  ]

  let productCount = 0
  const catBySlug = Object.fromEntries(
    (await prisma.productCategory.findMany({ select: { id: true, slug: true } }))
      .map(c => [c.slug, c.id]),
  )
  for (const group of boutiqueProducts) {
    const mId = merchantMap[group.merchantSlug]
    if (!mId) continue
    const shopId = `shop_${mId}`
    for (const p of group.products) {
      const categoryId =
        group.merchantSlug === 'yale-design'
          ? catBySlug['mode-vetements'] ?? null
          : group.merchantSlug === 'galerie-korhogo'
            ? catBySlug['artisanat-sculpture'] ?? catBySlug['artisanat'] ?? null
            : null
      await prisma.product.upsert({
        where: { shop_id_slug: { shop_id: shopId, slug: p.slug } },
        update: {
          name: p.name,
          price: p.price,
          stock_quantity: p.stock,
          image_url: p.image,
          description: p.desc,
          status: 'ACTIVE',
          category_id: categoryId,
        },
        create: {
          shop_id: shopId,
          name: p.name,
          slug: p.slug,
          price: p.price,
          stock_quantity: p.stock,
          image_url: p.image,
          description: p.desc,
          status: 'ACTIVE',
          category_id: categoryId,
        },
      })
      productCount++
    }
  }
  console.log(`✅ ${productCount} produits marketplace créés`)

  await prisma.platformSetting.upsert({
    where: { key: 'marketplace_spotlight_limit' },
    create: { key: 'marketplace_spotlight_limit', value: '8' },
    update: {},
  })

  for (const slug of ['yale-design', 'galerie-korhogo']) {
    const mId = merchantMap[slug]
    if (!mId) continue
    await prisma.shop.updateMany({
      where: { OR: [{ id: `shop_${mId}` }, { merchant_id: mId }] },
      data: { marketplace_featured: true },
    })
  }

  // ─── ZONES LIVRAISON (seed Abidjan) ─────────────────────────────────────────

  const cocody = await prisma.geoCommune.findFirst({
    where: { city_id: abidjan.id, slug: 'cocody' },
  })
  const plateau = await prisma.geoCommune.findFirst({
    where: { city_id: abidjan.id, slug: 'plateau' },
  })
  const yopougon = await prisma.geoCommune.findFirst({
    where: { city_id: abidjan.id, slug: 'yopougon' },
  })

  if (cocody && plateau) {
    for (const merchantSlug of ['yale-design', 'galerie-korhogo']) {
      const mId = merchantMap[merchantSlug]
      if (!mId) continue
      const shopId = `shop_${mId}`
      const existing = await prisma.shopDeliveryZone.findFirst({
        where: { shop_id: shopId, name: 'Abidjan — Cocody & Plateau' },
      })
      if (!existing) {
        await prisma.shopDeliveryZone.create({
          data: {
            shop_id: shopId,
            name: 'Abidjan — Cocody & Plateau',
            description: 'Livraison moto intra-communes Cocody et Plateau',
            fee: merchantSlug === 'yale-design' ? 1500 : 2000,
            min_order_amount: 5000,
            free_delivery_threshold: 50000,
            eta_min_minutes: 45,
            eta_max_minutes: 75,
            vehicle: 'MOTO',
            priority: 10,
            rules: {
              create: [
                {
                  city_id: abidjan.id,
                  all_communes: false,
                  communes: { create: [{ commune_id: cocody.id }, { commune_id: plateau.id }] },
                },
              ],
            },
          },
        })
      }
    }
    console.log('✅ Zones livraison seed (Cocody + Plateau)')
  }

  if (yopougon) {
    const yaleId = merchantMap['yale-design']
    if (yaleId) {
      const shopId = `shop_${yaleId}`
      const existing = await prisma.shopDeliveryZone.findFirst({
        where: { shop_id: shopId, name: 'Abidjan — Yopougon' },
      })
      if (!existing) {
        await prisma.shopDeliveryZone.create({
          data: {
            shop_id: shopId,
            name: 'Abidjan — Yopougon',
            fee: 2500,
            eta_min_minutes: 60,
            eta_max_minutes: 90,
            vehicle: 'MOTO',
            rules: {
              create: [{ city_id: abidjan.id, all_communes: false, communes: { create: [{ commune_id: yopougon.id }] } }],
            },
          },
        })
      }
    }
  }

  // ─── PROMO CHECKOUT (seed) ───────────────────────────────────────────────────

  const yaleMerchantId = merchantMap['yale-design']
  if (yaleMerchantId) {
    const starts = new Date()
    const ends = new Date()
    ends.setFullYear(ends.getFullYear() + 1)
    await prisma.promotion.upsert({
      where: { merchant_id_code: { merchant_id: yaleMerchantId, code: 'BIENVENUE15' } },
      update: { is_active: true, ends_at: ends },
      create: {
        merchant_id: yaleMerchantId,
        shop_id: `shop_${yaleMerchantId}`,
        title: 'Bienvenue — 15 %',
        description: '−15 % sur votre première commande Yalé Design',
        type: 'PERCENTAGE',
        value: 15,
        code: 'BIENVENUE15',
        min_order_amount: 10000,
        starts_at: starts,
        ends_at: ends,
        max_uses: 500,
      },
    })
    console.log('✅ Promo seed BIENVENUE15 (Yalé Design)')
  }

  console.log('\n🎉 Base de données LaPlasse initialisée avec succès !')
  console.log(`   → ${categories.length} catégories`)
  console.log('   → Utilisateurs : admin@laplasse.ci / Admin2026!')
  console.log('   → Utilisateurs : ksouary@gmail.com / Ksoary2026!')
  console.log(`   → ${merchantCount} marchands Abidjan`)
  console.log('   → Reviews et horaires créés')

  // ─── VERTICALS, MULTI-PAYS, DELIVERY ─────────────────────────────────────────

  const { seedVerticals } = await import('./seed-verticals')
  const { seedMultipays } = await import('./seed-multipays')
  const { seedDelivery } = await import('./seed-delivery')

  await seedVerticals({
    prisma,
    merchantMap,
    testUserId: testUser.id,
  })

  const multipaysMap = await seedMultipays({ prisma, cat, ouagaCityId: ouaga.id, dakarCityId: dakar.id })
  Object.assign(merchantMap, multipaysMap)

  // Menus / prestations pour vitrines BF/SN
  await seedVerticals({
    prisma,
    merchantMap,
    testUserId: testUser.id,
  })

  await seedDelivery(prisma)
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
