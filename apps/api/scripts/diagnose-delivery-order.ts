/**
 * Diagnose delivery order/job/offers for a given order ID.
 * Usage: npx tsx scripts/diagnose-delivery-order.ts <orderId>
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const orderId = process.argv[2]
if (!orderId) {
  console.error('Usage: npx tsx scripts/diagnose-delivery-order.ts <orderId>')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shop: { select: { id: true, name: true, city: true, country: true, delivery_fulfilment_default: true } },
      delivery_job: {
        include: {
          courier_profile: { select: { id: true, kind: true, user: { select: { email: true, full_name: true } } } },
          offer_rejections: true,
        },
      },
    },
  })

  if (!order) {
    console.log('Order NOT FOUND')
    return
  }

  console.log('\n=== ORDER ===')
  console.log(JSON.stringify({
    id: order.id,
    status: order.status,
    delivery_type: order.delivery_type,
    delivery_fulfilment_mode: order.delivery_fulfilment_mode,
    logistics_partner_id: order.logistics_partner_id,
    delivery_city_id: order.delivery_city_id,
    delivery_commune_id: order.delivery_commune_id,
    delivery_address: order.delivery_address,
    shop: order.shop,
  }, null, 2))

  console.log('\n=== DELIVERY JOB ===')
  if (!order.delivery_job) {
    console.log('NO delivery job')
  } else {
    const j = order.delivery_job
    console.log(JSON.stringify({
      id: j.id,
      status: j.status,
      fulfilment_mode: j.fulfilment_mode,
      logistics_partner_id: j.logistics_partner_id,
      courier_profile_id: j.courier_profile_id,
      offered_to_profile_id: j.offered_to_profile_id,
      offered_at: j.offered_at,
      offer_expires_at: j.offer_expires_at,
      rejected_count: j.rejected_count,
      courier: j.courier_profile,
      rejections: j.offer_rejections.length,
    }, null, 2))
  }

  const couriers = await prisma.courierProfile.findMany({
    where: { user: { email: 'livreur@laplasse.ci' } },
    include: {
      user: { select: { email: true, full_name: true } },
      service_zones: {
        where: { is_active: true },
        include: {
          city: { select: { id: true, name: true, slug: true } },
          communes: { select: { commune_id: true } },
        },
      },
    },
  })

  console.log('\n=== COURIER livreur@laplasse.ci ===')
  for (const c of couriers) {
    console.log(JSON.stringify({
      id: c.id,
      kind: c.kind,
      status: c.status,
      is_online: c.is_online,
      country: c.country,
      city: c.city,
      logistics_partner_id: c.logistics_partner_id,
      shop_id: c.shop_id,
      zones: c.service_zones.map(z => ({
        city: z.city,
        all_communes: z.all_communes,
        communes: z.communes.map(x => x.commune_id),
      })),
    }, null, 2))
  }

  const onlineIndependent = await prisma.courierProfile.findMany({
    where: { kind: 'INDEPENDENT', status: 'ACTIVE', is_online: true },
    select: { id: true, city: true, user: { select: { email: true } } },
    take: 10,
  })
  console.log('\n=== ONLINE INDEPENDENT couriers ===')
  console.log(onlineIndependent)

  const pendingJobs = await prisma.deliveryJob.findMany({
    where: {
      status: 'PENDING',
      courier_profile_id: null,
      fulfilment_mode: 'PLATFORM_RIDER',
    },
    select: {
      id: true,
      order_id: true,
      offered_to_profile_id: true,
      offer_expires_at: true,
      order: { select: { status: true, delivery_city_id: true } },
    },
    take: 10,
  })
  console.log('\n=== PENDING PLATFORM_RIDER jobs ===')
  console.log(JSON.stringify(pendingJobs, null, 2))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
