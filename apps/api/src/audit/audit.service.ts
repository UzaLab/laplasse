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

  async listRecent(limit = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, email: true, full_name: true, role: true } },
      },
    })
  }
}
