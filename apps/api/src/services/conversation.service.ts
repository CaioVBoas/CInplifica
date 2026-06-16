import prisma from './prisma';
import notificationService from './notification.service';

type ConversationUser = {
  id: string;
  name: string;
  email: string;
};

type ConversationMessagePreview = {
  id: string;
  text: string;
  senderId: string;
  conversationId: string;
  createdAt: Date;
};

type ConversationWithUsers = {
  id: string;
  listingId?: string | null;
  status?: string;
  completedAt?: Date | null;
  completedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
  users: ConversationUser[];
  messages?: ConversationMessagePreview[];
  reviews?: {
    id: string;
    rating: number;
    comment: string | null;
    reviewerId: string;
    reviewedUserId: string;
    conversationId: string;
    listingId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

const toConversationResponse = (conversation: ConversationWithUsers, unreadCount = 0) => {
  const { users, messages = [], ...rest } = conversation;

  return {
    ...rest,
    participants: users,
    messages,
    unreadCount,
  };
};

export class ConversationService {
  async getOrCreateConversation(userIds: string[], listingId?: string) {
    const uniqueUserIds = Array.from(new Set(userIds));
    if (uniqueUserIds.length !== 2) {
      throw new Error('A conversa precisa ter dois participantes distintos.');
    }

    const usersCount = await prisma.user.count({
      where: {
        id: { in: uniqueUserIds },
        status: { not: 'SUSPENDED' },
      },
    });

    if (usersCount !== uniqueUserIds.length) {
      throw new Error('Participante não encontrado.');
    }

    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { authorId: true },
      });

      if (!listing) {
        throw new Error('Anúncio não encontrado.');
      }

      if (!uniqueUserIds.includes(listing.authorId)) {
        throw new Error('A negociação deve incluir o autor do anúncio.');
      }
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          ...uniqueUserIds.map((id) => ({
            users: { some: { id } },
          })),
          listingId ? { listingId } : { listingId: null },
        ],
      },
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        reviews: true,
      },
    });

    if (existing) return toConversationResponse(existing);

    const conversation = await prisma.conversation.create({
      data: {
        users: {
          connect: uniqueUserIds.map((id) => ({ id })),
        },
        listing: listingId ? { connect: { id: listingId } } : undefined,
      },
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        reviews: true,
      },
    });

    return toConversationResponse(conversation);
  }

  async getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        users: { some: { id: userId } },
      },
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        reviews: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const unreadCounts = await Promise.all(
      conversations.map((conversation) => this.getUnreadCount(conversation.id, userId))
    );

    return conversations.map((conversation, index) => toConversationResponse(conversation, unreadCounts[index]));
  }

  async completeConversation(conversationId: string, currentUserId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: {
          select: { id: true, name: true, email: true },
        },
        listing: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        reviews: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversa não encontrada.');
    }

    if (!conversation.users.some((participant) => participant.id === currentUserId)) {
      throw new Error('Apenas participantes podem concluir esta negociação.');
    }

    if (conversation.status === 'COMPLETED') {
      return toConversationResponse(conversation);
    }

    const nextListingStatus = conversation.listing
      ? conversation.listing.category === 'SALE'
        ? 'SOLD'
        : conversation.listing.category === 'LOST_FOUND'
          ? 'RETURNED'
          : 'FINALIZED'
      : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      if (conversation.listingId && nextListingStatus) {
        await tx.listing.update({
          where: { id: conversation.listingId },
          data: { status: nextListingStatus },
        });
      }

      return tx.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          completedById: currentUserId,
        },
        include: {
          users: {
            select: { id: true, name: true, email: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
          reviews: true,
        },
      });
    });

    return toConversationResponse(updated);
  }

  async getMessages(conversationId: string, userId?: string) {
    if (userId) {
      await this.ensureParticipant(conversationId, userId);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (userId) {
      await this.markConversationRead(conversationId, userId);
    }

    return messages;
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
    await this.ensureParticipant(conversationId, senderId);

    const message = await prisma.message.create({
      data: {
        text,
        senderId,
        conversationId,
      },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    await notificationService.createMessageNotifications(conversationId, senderId, text);

    return message;
  }

  async markConversationRead(conversationId: string, userId: string) {
    await this.ensureParticipant(conversationId, userId);

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        reads: {
          none: { userId },
        },
      },
      select: { id: true },
    });

    if (messages.length === 0) return;

    await prisma.messageRead.createMany({
      data: messages.map((message) => ({ messageId: message.id, userId })),
      skipDuplicates: true,
    });
  }

  async getTotalUnreadCount(userId: string) {
    return prisma.message.count({
      where: {
        senderId: { not: userId },
        conversation: {
          users: { some: { id: userId } },
        },
        reads: {
          none: { userId },
        },
      },
    });
  }

  private getUnreadCount(conversationId: string, userId: string) {
    return prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        reads: {
          none: { userId },
        },
      },
    });
  }

  private async ensureParticipant(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        users: { some: { id: userId } },
      },
      select: { id: true },
    });

    if (!conversation) {
      throw new Error('Acesso restrito aos participantes da conversa.');
    }
  }
}

export default new ConversationService();
