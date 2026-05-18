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

export interface Conversation {
  id: string;
  participants: Participant[];
  messages: Message[];
  updatedAt: string;
}
