/**
 * Seed demo data for Delivery Network stakeholders (partner + contract).
 * Usage: node dist/prisma/seed-delivery-stakeholders.js
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { hash } from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const PARTNER_EMAIL = 'logistique@laplasse.ci'
const PARTNER_PASSWORD = 'Logistique2026!'
const MERCHANT_EMAIL = 'ksouary@gmail.com'

async function main() {
  const passwordHash = await hash(PARTNER_PASSWORD, 10)

  let user = await prisma.user.findUnique({ where: { email: PARTNER_EMAIL } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: PARTNER_EMAIL,
        password_hash: passwordHash,
        full_name: 'Express Abidjan',
        role: 'USER',
        is_active: true,
      },
    })
    console.log('Created partner owner user:', PARTNER_EMAIL)
  }

  let partner = await prisma.logisticsPartner.findUnique({ where: { owner_user_id: user.id } })
  if (!partner) {
    partner = await prisma.logisticsPartner.create({
      data: {
        owner_user_id: user.id,
        legal_name: 'Express Abidjan SARL',
        trade_name: 'Express Abidjan',
        slug: 'express-abidjan',
        country: 'CI',
        city: 'Abidjan',
        phone: '+2250700000099',
        email: PARTNER_EMAIL,
        verification: 'VERIFIED',
        is_active: true,
      },
    })
    await prisma.logisticsPartnerStaff.upsert({
      where: { user_id: user.id },
      create: { logistics_partner_id: partner.id, user_id: user.id, role: 'OWNER' },
      update: { logistics_partner_id: partner.id },
    })
    console.log('Created verified logistics partner:', partner.slug)
  } else if (partner.verification !== 'VERIFIED') {
    partner = await prisma.logisticsPartner.update({
      where: { id: partner.id },
      data: { verification: 'VERIFIED', is_active: true },
    })
    console.log('Verified existing partner:', partner.slug)
  }

  const merchant = await prisma.merchant.findFirst({
    where: { owner: { email: MERCHANT_EMAIL } },
    include: { shop: true },
  })
  const shop = merchant?.shop ?? await prisma.shop.findFirst({
    where: { owner: { email: MERCHANT_EMAIL } },
  })
  if (!shop) {
    console.warn(`No shop for merchant ${MERCHANT_EMAIL} — skip contract`)
  } else {
    const contract = await prisma.deliveryPartnerContract.upsert({
      where: {
        shop_id_logistics_partner_id: {
          shop_id: shop.id,
          logistics_partner_id: partner.id,
        },
      },
      create: {
        shop_id: shop.id,
        logistics_partner_id: partner.id,
        status: 'ACTIVE',
        signed_at: new Date(),
      },
      update: { status: 'ACTIVE', signed_at: new Date() },
    })
    console.log('Active contract shop ↔ partner:', contract.id)
  }

  const FLEET_EMAIL = 'flotte@laplasse.ci'
  const FLEET_PASSWORD = 'Flotte2026!'

  let fleetUser = await prisma.user.findUnique({
    where: { email: FLEET_EMAIL },
    include: { courier_profile: true },
  })
  if (!fleetUser) {
    const fleetHash = await hash(FLEET_PASSWORD, 10)
    fleetUser = await prisma.user.create({
      data: {
        email: FLEET_EMAIL,
        password_hash: fleetHash,
        full_name: 'Flotte Express Demo',
        phone: '+2250700000088',
        role: 'COURIER',
        is_verified: true,
        is_active: true,
        city: 'Abidjan',
        country: 'CI',
        courier_profile: {
          create: {
            city: 'Abidjan',
            country: 'CI',
            phone: '+2250700000088',
            vehicle: 'MOTO',
            status: 'ACTIVE',
            kind: 'PARTNER_FLEET',
            logistics_partner_id: partner.id,
          },
        },
      },
      include: { courier_profile: true },
    })
    console.log('Created fleet courier:', FLEET_EMAIL)
  } else if (fleetUser.courier_profile) {
    await prisma.courierProfile.update({
      where: { id: fleetUser.courier_profile.id },
      data: {
        kind: 'PARTNER_FLEET',
        logistics_partner_id: partner.id,
        shop_id: null,
        merchant_id: null,
        status: 'ACTIVE',
      },
    })
    console.log('Updated fleet courier:', FLEET_EMAIL)
  }

  console.log('\nDemo credentials:')
  console.log(`  Partner portal: ${PARTNER_EMAIL} / ${PARTNER_PASSWORD}`)
  console.log(`  Fleet courier : ${FLEET_EMAIL} / ${FLEET_PASSWORD}`)
  console.log(`  Platform rider: livreur@laplasse.ci / Courier2026!`)
  console.log(`  URL: /logistics`)
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
