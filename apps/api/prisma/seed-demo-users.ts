/**
 * Comptes utilisateurs démo — idempotent (upsert).
 * Aligné sur prisma/seed.ts (mots de passe identiques).
 */
import 'dotenv/config'
import { hash } from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

export async function seedDemoUsers() {
  const [adminPwd, ksoaryPwd, bushmanPwd, yalePwd] = await Promise.all([
    hash('Admin2026!', 12),
    hash('Ksoary2026!', 12),
    hash('Bushman2026!', 12),
    hash('Yale2026!', 12),
  ])

  await prisma.user.upsert({
    where: { email: 'admin@laplasse.ci' },
    update: { password_hash: adminPwd, role: 'ADMIN', is_verified: true, is_active: true },
    create: {
      email: 'admin@laplasse.ci',
      password_hash: adminPwd,
      full_name: 'Admin LaPlasse',
      role: 'ADMIN',
      is_verified: true,
      is_active: true,
      city: 'Abidjan',
      country: 'CI',
    },
  })

  await prisma.user.upsert({
    where: { email: 'ksouary@gmail.com' },
    update: { password_hash: ksoaryPwd, is_verified: true, is_active: true },
    create: {
      email: 'ksouary@gmail.com',
      password_hash: ksoaryPwd,
      full_name: 'Karim Souary',
      role: 'USER',
      is_verified: true,
      is_active: true,
      city: 'Abidjan',
      country: 'CI',
    },
  })

  await prisma.user.upsert({
    where: { email: 'bushman@laplasse.ci' },
    update: { password_hash: bushmanPwd, role: 'MERCHANT', is_verified: true, is_active: true },
    create: {
      email: 'bushman@laplasse.ci',
      phone: '+22507000001',
      password_hash: bushmanPwd,
      full_name: 'Konan Yao',
      role: 'MERCHANT',
      is_verified: true,
      is_active: true,
      city: 'Abidjan',
      country: 'CI',
    },
  })

  await prisma.user.upsert({
    where: { email: 'owner3@laplasse.ci' },
    update: { password_hash: yalePwd, role: 'MERCHANT', is_verified: true, is_active: true },
    create: {
      email: 'owner3@laplasse.ci',
      phone: '+22508000003',
      password_hash: yalePwd,
      full_name: 'Marchand 3',
      role: 'MERCHANT',
      is_verified: true,
      is_active: true,
      city: 'Abidjan',
      country: 'CI',
    },
  })

  console.log('✅ Comptes démo utilisateurs prêts')
  console.log('   admin@laplasse.ci / Admin2026!')
  console.log('   ksouary@gmail.com / Ksoary2026!')
  console.log('   bushman@laplasse.ci / Bushman2026!')
  console.log('   owner3@laplasse.ci / Yale2026!')
}

async function main() {
  await seedDemoUsers()
}

if (require.main === module) {
  main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => {
      await prisma.$disconnect()
      await pool.end()
    })
}
