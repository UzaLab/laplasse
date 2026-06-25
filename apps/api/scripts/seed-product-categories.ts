import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { seedProductCategories } from '../prisma/seed-product-categories'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  try {
    const stats = await seedProductCategories(prisma)
    console.log(`✅ ${stats.roots} catégories racines, ${stats.children} sous-catégories (${stats.total} total)`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
