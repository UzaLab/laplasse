import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditAction } from '../../generated/prisma/client'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string
    action: AuditAction
    entityType: string
    entityId?: string
    payload?: Record<string, unknown>
    ip?: string
  }) {
    return this.prisma.auditLog.create({
      data: {
        user_id: params.userId ?? null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId ?? null,
        payload: params.payload as never,
        ip: params.ip ?? null,
      },
    })
  }

  async listRecent(
    limit = 50,
    filters?: { action?: string; entity_type?: string; q?: string },
  ) {
    const q = filters?.q?.trim()
    return this.prisma.auditLog.findMany({
      where: {
        ...(filters?.action ? { action: filters.action as AuditAction } : {}),
        ...(filters?.entity_type ? { entity_type: filters.entity_type } : {}),
        ...(q
          ? {
              OR: [
                { entity_id: { contains: q, mode: 'insensitive' } },
                { entity_type: { contains: q, mode: 'insensitive' } },
                { user: { email: { contains: q, mode: 'insensitive' } } },
                { user: { full_name: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, email: true, full_name: true, role: true } },
      },
    })
  }
}
