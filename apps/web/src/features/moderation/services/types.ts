export type ReportTargetType = 'LISTING' | 'MESSAGE' | 'CONVERSATION';
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'RESOLVED';
export type ModerationActionType = 'APPROVE_REPORT' | 'REJECT_REPORT' | 'SUSPEND_USER' | 'REMOVE_CONTENT';

export interface ModerationUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ModerationAction {
  id: string;
  action: ModerationActionType;
  reportId: string | null;
  targetType: ReportTargetType | null;
  targetId: string | null;
  reason: string | null;
  moderatorId: string;
  moderator: ModerationUser;
  createdAt: string;
}

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  reporterId: string;
  reporter: ModerationUser;
  moderationActions: ModerationAction[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  actor: ModerationUser | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
