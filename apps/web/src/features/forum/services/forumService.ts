const API_BASE = '/api/forum';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export interface ForumAuthor {
  id: string;
  name: string;
  email: string;
  picture: string | null;
}

export interface ForumComment {
  id: string;
  content: string;
  author: ForumAuthor;
  createdAt: string;
}

export interface ForumAnswer {
  id: string;
  content: string;
  author: ForumAuthor;
  comments: ForumComment[];
  createdAt: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  author: ForumAuthor;
  answers?: ForumAnswer[];
  _count?: { answers: number };
  createdAt: string;
}

export interface TopicListResult {
  data: ForumTopic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const forumService = {
  async listTopics(page = 1, limit = 20): Promise<TopicListResult> {
    const res = await fetch(`${API_BASE}/topics?page=${page}&limit=${limit}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Falha ao carregar tópicos.');
    return res.json();
  },

  async getTopic(id: string): Promise<ForumTopic> {
    const res = await fetch(`${API_BASE}/topics/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Tópico não encontrado.');
    return res.json();
  },

  async createTopic(title: string, content: string): Promise<ForumTopic> {
    const res = await fetch(`${API_BASE}/topics`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Falha ao criar tópico.');
    }
    return res.json();
  },

  async createAnswer(topicId: string, content: string): Promise<ForumAnswer> {
    const res = await fetch(`${API_BASE}/topics/${topicId}/answers`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Falha ao publicar resposta.');
    }
    return res.json();
  },

  async deleteAnswer(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/answers/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Falha ao excluir resposta.');
    }
  },

  async createComment(answerId: string, content: string): Promise<ForumComment> {
    const res = await fetch(`${API_BASE}/answers/${answerId}/comments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Falha ao publicar comentário.');
    }
    return res.json();
  },

  async deleteComment(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/comments/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || 'Falha ao excluir comentário.');
    }
  },
};
