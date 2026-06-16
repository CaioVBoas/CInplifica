import { AuditLog, ModerationAction, Report, ReportStatus } from './types';

const API_BASE_URL = '/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const parseResponse = async <T>(response: Response, fallbackMessage: string): Promise<T> => {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || fallbackMessage);
  }

  return response.json();
};

export const moderationService = {
  async fetchReports(status?: ReportStatus): Promise<Report[]> {
    const url = new URL(`${API_BASE_URL}/reports`, window.location.origin);
    if (status) url.searchParams.set('status', status);

    const response = await fetch(url.toString(), {
      headers: authHeaders(),
    });

    return parseResponse<Report[]>(response, 'Falha ao carregar denúncias.');
  },

  async approveReport(
    reportId: string,
    data: { reason?: string; removeContent?: boolean; suspendUser?: boolean },
  ): Promise<ModerationAction> {
    const response = await fetch(`${API_BASE_URL}/moderation/reports/${reportId}/approve`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });

    return parseResponse<ModerationAction>(response, 'Falha ao aprovar denúncia.');
  },

  async rejectReport(reportId: string, reason?: string): Promise<ModerationAction> {
    const response = await fetch(`${API_BASE_URL}/moderation/reports/${reportId}/reject`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });

    return parseResponse<ModerationAction>(response, 'Falha ao rejeitar denúncia.');
  },

  async fetchActions(): Promise<ModerationAction[]> {
    const response = await fetch(`${API_BASE_URL}/moderation/actions`, {
      headers: authHeaders(),
    });

    return parseResponse<ModerationAction[]>(response, 'Falha ao carregar histórico de moderação.');
  },

  async fetchAuditLogs(): Promise<AuditLog[]> {
    const response = await fetch(`${API_BASE_URL}/audit-logs`, {
      headers: authHeaders(),
    });

    return parseResponse<AuditLog[]>(response, 'Falha ao carregar audit log.');
  },
};
