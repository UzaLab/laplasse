/**
 * Seed delivery engine — coursiers de démo.
 */

import type { PrismaClient } from '../generated/prisma/client'

export async function seedDelivery(prisma: PrismaClient) {
  const couriers = [
    { id: 'courier-ci-1', full_name: 'Kouadio Yao', phone: '+22507001101', country: 'CI', city: 'Abidjan', vehicle: 'MOTO' as const },
    { id: 'courier-ci-2', full_name: 'Aminata Traoré', phone: '+22507001102', country: 'CI', city: 'Abidjan', vehicle: 'MOTO' as const },
    { id: 'courier-bf-1', full_name: 'Issa Ouédraogo', phone: '+22670001101', country: 'BF', city: 'Ouagadougou', vehicle: 'MOTO' as const },
    { id: 'courier-sn-1', full_name: 'Moussa Diop', phone: '+22177001101', country: 'SN', city: 'Dakar', vehicle: 'MOTO' as const },
  ]

  for (const c of couriers) {
    await prisma.deliveryCourier.upsert({
      where: { id: c.id },
      update: { is_active: true },
      create: c,
    })
  }

  console.log(`✅ Seed delivery : ${couriers.length} coursiers`)
}
