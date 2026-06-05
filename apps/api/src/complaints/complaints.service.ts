import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: { merchant_id: string; reason: string; description?: string },
    userId: string,
  ) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id: data.merchant_id } })
    if (!merchant) throw new NotFoundException('Merchant not found')

    return this.prisma.complaint.create({
      data: {
        merchant_id: data.merchant_id,
        user_id: userId,
        reason: data.reason,
        description: data.description ?? null,
        status: 'OPEN',
      },
      select: {
        id: true, reason: true, status: true, created_at: true,
        merchant: { select: { business_name: true, slug: true } },
      },
    })
  }

  async findAll(filter?: string) {
    const where = filter === 'open'
      ? { status: { in: ['OPEN' as const, 'UNDER_REVIEW' as const] } }
      : {}

    const complaints = await this.prisma.complaint.findMany({
      where,
      include: {
        merchant: { select: { id: true, business_name: true, slug: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    })

    const userIds = [...new Set(complaints.map(c => c.user_id))]
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, full_name: true },
    })
    const userMap = Object.fromEntries(users.map(u => [u.id, u]))

    return complaints.map(c => ({
      ...c,
      reporter: userMap[c.user_id] ?? { id: c.user_id, email: 'inconnu', full_name: null },
    }))
  }

  async moderate(id: string, action: 'review' | 'resolve' | 'dismiss') {
    const statusMap = {
      review: 'UNDER_REVIEW' as const,
      resolve: 'RESOLVED' as const,
      dismiss: 'DISMISSED' as const,
    }

    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: statusMap[action],
        resolved_at: action === 'resolve' || action === 'dismiss' ? new Date() : undefined,
      },
      select: { id: true, status: true, resolved_at: true },
    })
  }
}
