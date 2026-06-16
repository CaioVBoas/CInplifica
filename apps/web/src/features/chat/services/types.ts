export interface Message {
  id: string;
  text: string;
  senderId: string;
  conversationId: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewerId: string;
  reviewedUserId: string;
  conversationId: string;
  listingId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  listingId: string | null;
  status: 'OPEN' | 'COMPLETED';
  completedAt: string | null;
  completedById: string | null;
  participants: Participant[];
  messages: Message[];
  reviews: Review[];
  updatedAt: string;
  unreadCount: number;
}
