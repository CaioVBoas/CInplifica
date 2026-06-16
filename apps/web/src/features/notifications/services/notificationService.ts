export interface NotificationItem {
  id: string;
  type: 'MESSAGE' | 'INTEREST_ALERT';
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface InterestKeyword {
  id: string;
  keyword: string;
  createdAt: string;
}

const API_BASE_URL = '/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

export const notificationService = {
  async fetchNotifications(): Promise<NotificationItem[]> {
    const response = await fetch(`${API_BASE_URL}/notifications`, { headers: authHeaders() });
    if (!response.ok) throw new Error('Falha ao carregar notificações.');
    return response.json();
  },

  async fetchUnreadCount(type?: NotificationItem['type']): Promise<{ count: number }> {
    const url = new URL(`${API_BASE_URL}/notifications/unread-count`, window.location.origin);
    if (type) url.searchParams.set('type', type);
    const response = await fetch(url.toString(), { headers: authHeaders() });
    if (!response.ok) throw new Error('Falha ao carregar contador.');
    return response.json();
  },

  async markAllRead(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Falha ao marcar notificações como lidas.');
  },

  async fetchKeywords(): Promise<InterestKeyword[]> {
    const response = await fetch(`${API_BASE_URL}/interests/keywords`, { headers: authHeaders() });
    if (!response.ok) throw new Error('Falha ao carregar interesses.');
    return response.json();
  },

  async addKeyword(keyword: string): Promise<InterestKeyword> {
    const response = await fetch(`${API_BASE_URL}/interests/keywords`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ keyword }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Falha ao cadastrar interesse.');
    }
    return response.json();
  },

  async deleteKeyword(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/interests/keywords/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Falha ao remover interesse.');
  },
};
