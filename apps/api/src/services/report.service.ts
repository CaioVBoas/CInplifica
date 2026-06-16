import { ReportStatus, ReportTargetType } from '@prisma/client';
import prisma from './prisma';

export interface CreateReportData {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description?: string;
  reporterId: string;
}

export interface ListReportsFilters {
  status?: ReportStatus;
  targetType?: ReportTargetType;
}

const validTargetTypes = new Set(Object.values(ReportTargetType));
const validStatuses = new Set(Object.values(ReportStatus));

export const parseReportTargetType = (value: unknown): ReportTargetType | null => {
  if (typeof value !== 'string') return null;

  const normalized = value.toUpperCase();
  return validTargetTypes.has(normalized as ReportTargetType) ? (normalized as ReportTargetType) : null;
};

export const parseReportStatus = (value: unknown): ReportStatus | null => {
  if (typeof value !== 'string') return null;

  const normalized = value.toUpperCase();
  return validStatuses.has(normalized as ReportStatus) ? (normalized as ReportStatus) : null;
};

export class ReportService {
  async create(data: CreateReportData) {
    await this.ensureTargetExists(data.targetType, data.targetId);

    return prisma.report.create({
      data: {
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
        reporterId: data.reporterId,
      },
      include: this.reportIncludes(),
    });
  }

  async list(filters: ListReportsFilters = {}) {
    return prisma.report.findMany({
      where: {
        status: filters.status,
        targetType: filters.targetType,
      },
      include: this.reportIncludes(),
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(id: string, status: ReportStatus) {
    return prisma.report.update({
      where: { id },
      data: { status },
      include: this.reportIncludes(),
    });
  }

  private async ensureTargetExists(targetType: ReportTargetType, targetId: string) {
    const target = await this.findTarget(targetType, targetId);

    if (!target) {
      throw new Error('Alvo da denúncia não encontrado.');
    }
  }

  private findTarget(targetType: ReportTargetType, targetId: string) {
    if (targetType === ReportTargetType.LISTING) {
      return prisma.listing.findUnique({ where: { id: targetId }, select: { id: true } });
    }

    if (targetType === ReportTargetType.MESSAGE) {
      return prisma.message.findUnique({ where: { id: targetId }, select: { id: true } });
    }

    return prisma.conversation.findUnique({ where: { id: targetId }, select: { id: true } });
  }

  private reportIncludes() {
    return {
      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      moderationActions: {
        include: {
          moderator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
    };
  }
}

export default new ReportService();
