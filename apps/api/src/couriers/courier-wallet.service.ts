import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/** Part livreur sur les frais de livraison (v1 — sans split partner). */
export const COURIER_EARNING_RATE = 0.75

@Injectable()
export class CourierWalletService {
  private readonly logger = new Logger(CourierWalletService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(courierProfileId: string) {
    const existing = await this.prisma.courierWallet.findUnique({
      where: { courier_id: courierProfileId },
    })
    if (existing) return existing

    return this.prisma.courierWallet.create({
      data: { courier_id: courierProfileId },
    })
  }

  async creditForDeliveredJob(jobId: string, courierProfileId: string) {
    const existing = await this.prisma.courierWalletEntry.findUnique({
      where: { job_id: jobId },
    })
    if (existing) return existing

    const job = await this.prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { order: { select: { delivery_fee: true, shop: { select: { name: true } } } } },
    })
    if (!job || job.courier_profile_id !== courierProfileId) return null

    const fee = job.order.delivery_fee ?? 0
    const amount = Math.round(fee * COURIER_EARNING_RATE)
    if (amount <= 0) return null

    const wallet = await this.getOrCreateWallet(courierProfileId)
    const shopName = job.order.shop?.name ?? 'Course'

    return this.prisma.$transaction(async tx => {
      const entry = await tx.courierWalletEntry.create({
        data: {
          wallet_id: wallet.id,
          job_id: jobId,
          amount,
          type: 'EARNING',
          label: `Livraison ${shopName}`,
        },
      })
      await tx.courierWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      })
      this.logger.log(`Wallet +${amount} FCFA for job ${jobId}`)
      return entry
    })
  }

  async getSummary(userId: string) {
    const profile = await this.prisma.courierProfile.findUnique({ where: { user_id: userId } })
    if (!profile) return null

    const wallet = await this.getOrCreateWallet(profile.id)
    const now = new Date()
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startWeek = new Date(startToday)
    startWeek.setDate(startWeek.getDate() - 7)
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const entries = await this.prisma.courierWalletEntry.findMany({
      where: { wallet_id: wallet.id, type: 'EARNING' },
      orderBy: { created_at: 'desc' },
    })

    const sumSince = (since: Date) =>
      entries.filter(e => e.created_at >= since).reduce((acc, e) => acc + e.amount, 0)

    return {
      balance: wallet.balance,
      today: sumSince(startToday),
      week: sumSince(startWeek),
      month: sumSince(startMonth),
      total_earned: entries.reduce((acc, e) => acc + e.amount, 0),
      completed_paid_jobs: entries.length,
    }
  }

  async listEntries(userId: string, page = 1, limit = 20) {
    const profile = await this.prisma.courierProfile.findUnique({ where: { user_id: userId } })
    if (!profile) return { items: [], total: 0, page, pageSize: limit, totalPages: 1 }

    const wallet = await this.getOrCreateWallet(profile.id)
    const safeLimit = Math.min(50, Math.max(1, limit))
    const safePage = Math.max(1, page)

    const [items, total] = await Promise.all([
      this.prisma.courierWalletEntry.findMany({
        where: { wallet_id: wallet.id },
        orderBy: { created_at: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.courierWalletEntry.count({ where: { wallet_id: wallet.id } }),
    ])

    return {
      items,
      total,
      page: safePage,
      pageSize: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    }
  }
}
