/**
 * Mission livraison démo — idempotent.
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-courier-demo-mission.ts
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const DEMO_ORDER_ID = 'demo-courier-mission-order'

async function main() {
  const abidjan = await prisma.geoCity.findFirst({
    where: { country: 'CI', slug: 'abidjan' },
    include: { communes: true },
  })
  const cocody = abidjan?.communes.find(c => c.slug === 'cocody')
  const plateau = abidjan?.communes.find(c => c.slug === 'plateau')
  if (!abidjan || !cocody) {
    throw new Error('Référentiel geo Abidjan/Cocody requis — lancez le seed principal')
  }

  const shop = await prisma.shop.findFirst({
    where: {
      country: 'CI',
      city: { contains: 'Abidjan', mode: 'insensitive' },
      status: 'ACTIVE',
    },
    orderBy: { created_at: 'asc' },
  })
  if (!shop) throw new Error('Aucune boutique active CI — lancez le seed principal')

  const customer = await prisma.user.findFirst({
    where: { email: 'ksouary@gmail.com', is_active: true },
  }) ?? await prisma.user.findFirst({ where: { role: 'USER', is_active: true } })
  if (!customer) throw new Error('Aucun client de test')

  const subtotal = 8500
  const deliveryFee = 1500

  const order = await prisma.order.upsert({
    where: { id: DEMO_ORDER_ID },
    update: {
      status: 'READY',
      delivery_type: 'DELIVERY',
      delivery_city_id: abidjan.id,
      delivery_commune_id: cocody.id,
      delivery_address: 'Riviera 2, près de la pharmacie',
      delivery_district: 'Cocody',
      customer_phone: '+22507001234',
    },
    create: {
      id: DEMO_ORDER_ID,
      user_id: customer.id,
      shop_id: shop.id,
      merchant_id: shop.merchant_id,
      status: 'READY',
      delivery_type: 'DELIVERY',
      delivery_city_id: abidjan.id,
      delivery_commune_id: cocody.id,
      delivery_address: 'Riviera 2, près de la pharmacie',
      delivery_district: 'Cocody',
      customer_phone: '+22507001234',
      subtotal,
      delivery_fee: deliveryFee,
      total: subtotal + deliveryFee,
      currency: 'XOF',
    },
  })

  const pickup = [shop.name, shop.address, shop.district, shop.city].filter(Boolean).join(', ')

  const job = await prisma.deliveryJob.upsert({
    where: { order_id: order.id },
    update: {
      status: 'PENDING',
      courier_profile_id: null,
      courier_id: null,
      pickup_address: pickup,
      dropoff_address: order.delivery_address ?? undefined,
      eta_minutes: 35,
    },
    create: {
      order_id: order.id,
      status: 'PENDING',
      pickup_address: pickup,
      dropoff_address: order.delivery_address ?? undefined,
      eta_minutes: 35,
    },
  })

  console.log('✅ Mission démo prête')
  console.log(`   Commande : ${order.id}`)
  console.log(`   Job      : ${job.id} (${job.status})`)
  console.log(`   Boutique : ${shop.name}`)
  console.log(`   Livraison: Cocody${plateau ? ' (zone demo livreur: Cocody+Plateau)' : ''}`)
  console.log('   → Connectez livreur@laplasse.ci, passez en ligne, onglet Missions')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
