import { Conversation, Message } from './types';

const API_BASE_URL = '/api';

export const chatService = {
  async fetchConversations(): Promise<Conversation[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    return response.json();
  },

  async fetchMessages(conversationId: string): Promise<Message[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    return response.json();
  },

  async startConversation(participantId: string, listingId?: string): Promise<Conversation> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ participantId, listingId }),
    });
    if (!response.ok) {
      throw new Error('Failed to start conversation');
    }
    return response.json();
  },

  async markConversationRead(conversationId: string): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to mark conversation as read');
    }
  },

  async fetchUnreadCount(): Promise<{ count: number }> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/conversations/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }
    return response.json();
  },

  async completeConversation(conversationId: string): Promise<Conversation> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Failed to complete conversation');
    }
    return response.json();
  },

  async createReview(data: {
    conversationId: string;
    reviewedUserId: string;
    rating: number;
    comment?: string;
  }) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || 'Failed to create review');
    }
    return response.json();
  },
};
