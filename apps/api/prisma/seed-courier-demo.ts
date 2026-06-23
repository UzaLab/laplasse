/**
 * Compte livreur démo — idempotent (upsert).
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-courier-demo.ts
 */
import 'dotenv/config'
import { hash } from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const DEMO = {
  email: 'livreur@laplasse.ci',
  password: 'Courier2026!',
  full_name: 'Kouamé Demo Livreur',
  phone: '+22507009901',
  city: 'Abidjan',
  country: 'CI',
  vehicle: 'MOTO' as const,
  plate_number: 'AB-123-LP',
}

async function main() {
  const password_hash = await hash(DEMO.password, 12)

  const user = await prisma.user.upsert({
    where: { email: DEMO.email },
    update: {
      password_hash,
      full_name: DEMO.full_name,
      phone: DEMO.phone,
      role: 'COURIER',
      is_verified: true,
      is_active: true,
      city: DEMO.city,
      country: DEMO.country,
    },
    create: {
      email: DEMO.email,
      password_hash,
      full_name: DEMO.full_name,
      phone: DEMO.phone,
      role: 'COURIER',
      is_verified: true,
      is_active: true,
      city: DEMO.city,
      country: DEMO.country,
    },
  })

  const profile = await prisma.courierProfile.upsert({
    where: { user_id: user.id },
    update: {
      city: DEMO.city,
      country: DEMO.country,
      phone: DEMO.phone,
      vehicle: DEMO.vehicle,
      plate_number: DEMO.plate_number,
      status: 'ACTIVE',
      kind: 'INDEPENDENT',
      logistics_partner_id: null,
      shop_id: null,
      merchant_id: null,
    },
    create: {
      user_id: user.id,
      city: DEMO.city,
      country: DEMO.country,
      phone: DEMO.phone,
      vehicle: DEMO.vehicle,
      plate_number: DEMO.plate_number,
      status: 'ACTIVE',
      kind: 'INDEPENDENT',
    },
  })

  const abidjan = await prisma.geoCity.findFirst({
    where: { country: 'CI', slug: 'abidjan', is_active: true },
    include: {
      communes: { where: { is_active: true }, take: 5 },
    },
  })

  if (abidjan) {
    const zone = await prisma.courierServiceZone.upsert({
      where: {
        courier_id_city_id: { courier_id: profile.id, city_id: abidjan.id },
      },
      update: { all_communes: true, is_active: true },
      create: {
        courier_id: profile.id,
        city_id: abidjan.id,
        all_communes: true,
        is_active: true,
      },
    })

    await prisma.courierServiceZoneCommune.deleteMany({ where: { zone_id: zone.id } })
  }

  console.log('✅ Compte livreur démo prêt')
  console.log(`   Email    : ${DEMO.email}`)
  console.log(`   Password : ${DEMO.password}`)
  console.log(`   Profil   : ${profile.id} (${profile.status})`)
  console.log(`   URL      : /courier/dashboard`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
