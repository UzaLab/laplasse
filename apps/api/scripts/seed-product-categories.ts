import { PrismaClient } from '../generated/prisma/client'
import { seedProductCategories } from '../prisma/seed-product-categories'

async function main() {
  const prisma = new PrismaClient()
  try {
    const stats = await seedProductCategories(prisma)
    console.log(`✅ ${stats.roots} catégories racines, ${stats.children} sous-catégories (${stats.total} total)`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
