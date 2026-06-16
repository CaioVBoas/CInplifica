import { ModerationActionType, ReportStatus, ReportTargetType } from '@prisma/client';
import prisma from './prisma';
import auditLogService from './audit-log.service';

export interface ResolveReportData {
  reportId: string;
  moderatorId: string;
  reason?: string;
  removeContent?: boolean;
  suspendUser?: boolean;
}

export interface RemoveContentData {
  targetType: ReportTargetType;
  targetId: string;
  moderatorId: string;
  reason?: string;
  reportId?: string;
}

export interface SuspendUserData {
  userId: string;
  moderatorId: string;
  reason?: string;
  reportId?: string;
}

export class ModerationService {
  async approveReport(data: ResolveReportData) {
    const report = await this.getReport(data.reportId);
    let removedContent = false;
    let suspendedUserId: string | null = null;

    if (data.removeContent) {
      await this.removeTargetContent({
        targetType: report.targetType,
        targetId: report.targetId,
      });
      removedContent = true;
    }

    if (data.suspendUser) {
      const targetUserId = await this.getTargetOwnerId(report.targetType, report.targetId);
      if (targetUserId) {
        await this.suspendUser({
          userId: targetUserId,
          moderatorId: data.moderatorId,
          reason: data.reason,
          reportId: data.reportId,
        });
        suspendedUserId = targetUserId;
      }
    }

    const action = await prisma.moderationAction.create({
      data: {
        action: ModerationActionType.APPROVE_REPORT,
        reportId: data.reportId,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: data.reason,
        moderatorId: data.moderatorId,
      },
      include: this.actionIncludes(),
    });

    await prisma.report.update({
      where: { id: data.reportId },
      data: { status: ReportStatus.RESOLVED },
    });

    await auditLogService.create({
      action: 'REPORT_APPROVED',
      entityType: 'Report',
      entityId: data.reportId,
      actorId: data.moderatorId,
      metadata: {
        targetType: report.targetType,
        targetId: report.targetId,
        removedContent,
        suspendedUserId,
      },
    });

    return action;
  }

  async rejectReport(data: ResolveReportData) {
    const report = await this.getReport(data.reportId);
    const action = await prisma.moderationAction.create({
      data: {
        action: ModerationActionType.REJECT_REPORT,
        reportId: data.reportId,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: data.reason,
        moderatorId: data.moderatorId,
      },
      include: this.actionIncludes(),
    });

    await prisma.report.update({
      where: { id: data.reportId },
      data: { status: ReportStatus.DISMISSED },
    });

    await auditLogService.create({
      action: 'REPORT_REJECTED',
      entityType: 'Report',
      entityId: data.reportId,
      actorId: data.moderatorId,
      metadata: {
        targetType: report.targetType,
        targetId: report.targetId,
      },
    });

    return action;
  }

  async removeContent(data: RemoveContentData) {
    await this.removeTargetContent(data);

    const action = await prisma.moderationAction.create({
      data: {
        action: ModerationActionType.REMOVE_CONTENT,
        reportId: data.reportId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        moderatorId: data.moderatorId,
      },
      include: this.actionIncludes(),
    });

    await auditLogService.create({
      action: 'CONTENT_REMOVED',
      entityType: String(data.targetType),
      entityId: data.targetId,
      actorId: data.moderatorId,
      metadata: { reportId: data.reportId },
    });

    return action;
  }

  async suspendUser(data: SuspendUserData) {
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
      },
    });

    const action = await prisma.moderationAction.create({
      data: {
        action: ModerationActionType.SUSPEND_USER,
        reportId: data.reportId,
        targetId: data.userId,
        reason: data.reason,
        moderatorId: data.moderatorId,
      },
      include: this.actionIncludes(),
    });

    await auditLogService.create({
      action: 'USER_SUSPENDED',
      entityType: 'User',
      entityId: data.userId,
      actorId: data.moderatorId,
      metadata: { reportId: data.reportId },
    });

    return action;
  }

  async listActions() {
    return prisma.moderationAction.findMany({
      include: this.actionIncludes(),
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });
  }

  private async getReport(reportId: string) {
    return prisma.report.findUniqueOrThrow({
      where: { id: reportId },
    });
  }

  private async removeTargetContent(data: { targetType: ReportTargetType; targetId: string }) {
    if (data.targetType === ReportTargetType.LISTING) {
      await prisma.listing.update({
        where: { id: data.targetId },
        data: { status: 'INACTIVE' },
      });
      return;
    }

    if (data.targetType === ReportTargetType.MESSAGE) {
      await prisma.message.update({
        where: { id: data.targetId },
        data: { text: '[mensagem removida pela moderação]' },
      });
      return;
    }

    await prisma.conversation.findUniqueOrThrow({
      where: { id: data.targetId },
      select: { id: true },
    });
  }

  private async getTargetOwnerId(targetType: ReportTargetType, targetId: string) {
    if (targetType === ReportTargetType.LISTING) {
      const listing = await prisma.listing.findUnique({
        where: { id: targetId },
        select: { authorId: true },
      });
      return listing?.authorId || null;
    }

    if (targetType === ReportTargetType.MESSAGE) {
      const message = await prisma.message.findUnique({
        where: { id: targetId },
        select: { senderId: true },
      });
      return message?.senderId || null;
    }

    return null;
  }

  private actionIncludes() {
    return {
      moderator: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      report: true,
    };
  }
}

export default new ModerationService();
