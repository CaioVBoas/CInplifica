import { Prisma } from '@prisma/client';
import prisma from './prisma';

export interface CreateAuditLogData {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export interface ListAuditLogsFilters {
  entityType?: string;
  actorId?: string;
  action?: string;
}

export class AuditLogService {
  async create(data: CreateAuditLogData) {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        actorId: data.actorId,
        metadata: data.metadata,
      },
    });
  }

  async list(filters: ListAuditLogsFilters = {}) {
    return prisma.auditLog.findMany({
      where: {
        entityType: filters.entityType,
        actorId: filters.actorId,
        action: filters.action,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }
}

export default new AuditLogService();
