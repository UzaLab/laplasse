/**
 * Re-trigger offers on stuck PENDING jobs (no courier assigned, no active offer).
 * Usage: npx tsx scripts/reoffer-pending-jobs.ts [orderId]
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const DELIVERY_OFFER_TIMEOUT_SEC = 30
const orderIdFilter = process.argv[2]

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function orderMatchesZones(
  order: {
    delivery_city_id: string | null
    delivery_commune_id: string | null
    shop: { city: string | null; country: string | null } | null
  },
  profileId: string,
  profileCountry: string,
): Promise<boolean> {
  if (order.shop?.country && order.shop.country.toUpperCase() !== profileCountry.toUpperCase()) {
    return false
  }
  const zones = await prisma.courierServiceZone.findMany({
    where: { courier_id: profileId, is_active: true },
    include: {
      communes: { select: { commune_id: true } },
      city: { select: { id: true, name: true, slug: true } },
    },
  })
  if (!zones.length) return false
  if (order.delivery_city_id) {
    for (const zone of zones) {
      if (zone.city_id !== order.delivery_city_id) continue
      if (zone.all_communes) return true
      if (
        order.delivery_commune_id
        && zone.communes.some(c => c.commune_id === order.delivery_commune_id)
      ) {
        return true
      }
    }
    return false
  }
  const shopCity = order.shop?.city?.toLowerCase().trim()
  if (!shopCity) return false
  return zones.some(z => {
    const name = z.city.name.toLowerCase()
    const slug = z.city.slug.toLowerCase()
    return shopCity.includes(name) || name.includes(shopCity) || shopCity === slug
  })
}

async function offerJob(jobId: string) {
  const job = await prisma.deliveryJob.findUnique({
    where: { id: jobId },
    include: {
      order: {
        select: {
          delivery_city_id: true,
          delivery_commune_id: true,
          shop: { select: { name: true, city: true, country: true } },
        },
      },
      offer_rejections: { select: { courier_profile_id: true } },
    },
  })
  if (!job || job.status !== 'PENDING' || job.courier_profile_id) return 'skipped'
  if (job.fulfilment_mode === 'MERCHANT_OWN') return 'merchant_own'

  const rejectedIds = new Set(job.offer_rejections.map(r => r.courier_profile_id))
  const kind = job.fulfilment_mode === 'LOGISTICS_PARTNER' ? 'PARTNER_FLEET' : 'INDEPENDENT'

  const couriers = await prisma.courierProfile.findMany({
    where: {
      status: 'ACTIVE',
      is_online: true,
      kind,
      ...(job.fulfilment_mode === 'LOGISTICS_PARTNER'
        ? { logistics_partner_id: job.logistics_partner_id ?? undefined }
        : {}),
      id: { notIn: [...rejectedIds] },
    },
    include: {
      user: { select: { email: true } },
      _count: {
        select: {
          jobs: { where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } } },
        },
      },
    },
    take: 60,
  })

  const zoneMatched = []
  for (const c of couriers) {
    if (kind === 'INDEPENDENT') {
      if (await orderMatchesZones(job.order, c.id, c.country)) zoneMatched.push(c)
    } else if (c.logistics_partner_id === job.logistics_partner_id) {
      zoneMatched.push(c)
    }
  }

  zoneMatched.sort((a, b) => {
    if (a._count.jobs !== b._count.jobs) return a._count.jobs - b._count.jobs
    return b.rating_avg - a.rating_avg
  })

  const candidate = zoneMatched[0]
  if (!candidate) return 'no_match'

  const now = new Date()
  const expires = new Date(now.getTime() + DELIVERY_OFFER_TIMEOUT_SEC * 1000)
  await prisma.deliveryJob.update({
    where: { id: jobId },
    data: {
      offered_to_profile_id: candidate.id,
      offered_at: now,
      offer_expires_at: expires,
    },
  })
  return `offered to ${candidate.user.email}`
}

async function main() {
  const jobs = await prisma.deliveryJob.findMany({
    where: {
      status: 'PENDING',
      courier_profile_id: null,
      ...(orderIdFilter ? { order_id: orderIdFilter } : {}),
    },
    select: { id: true, order_id: true },
  })

  console.log(`Found ${jobs.length} pending job(s) to re-offer`)
  for (const job of jobs) {
    const result = await offerJob(job.id)
    console.log(job.order_id, '→', result)
  }
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
