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

  async startConversation(participantId: string): Promise<Conversation> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ participantId }),
    });
    if (!response.ok) {
      throw new Error('Failed to start conversation');
    }
    return response.json();
  },
};
