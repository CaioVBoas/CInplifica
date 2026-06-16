import { Listing, NotificationType } from '@prisma/client';
import prisma from './prisma';

const normalizeKeyword = (value: string) => value.trim().toLowerCase();

export class NotificationService {
  async createMessageNotifications(conversationId: string, senderId: string, messageText: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        users: {
          select: { id: true },
        },
      },
    });

    if (!conversation) return;

    const recipients = conversation.users.filter((participant) => participant.id !== senderId);

    if (recipients.length === 0) return;

    await prisma.notification.createMany({
      data: recipients.map((recipient) => ({
        type: NotificationType.MESSAGE,
        title: 'Nova mensagem',
        body: messageText.length > 120 ? `${messageText.slice(0, 117)}...` : messageText,
        link: '/chat',
        userId: recipient.id,
      })),
    });
  }

  async createInterestAlerts(listing: Listing) {
    const searchableText = [
      listing.title,
      listing.description,
      listing.category,
      listing.academicSubject,
      listing.academicProfessor,
      listing.academicTerm,
      listing.lostFoundLocation,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const keywords = await prisma.interestKeyword.findMany({
      where: {
        userId: { not: listing.authorId },
      },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    const matchedUserIds = new Set<string>();
    for (const item of keywords) {
      if (searchableText.includes(item.keyword)) {
        matchedUserIds.add(item.userId);
      }
    }

    if (matchedUserIds.size === 0) return;

    await prisma.notification.createMany({
      data: Array.from(matchedUserIds).map((userId) => ({
        type: NotificationType.INTEREST_ALERT,
        title: 'Novo anúncio do seu interesse',
        body: listing.title,
        link: `/listings/${listing.id}`,
        userId,
      })),
    });
  }

  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(userId: string, type?: NotificationType) {
    return prisma.notification.count({
      where: {
        userId,
        type,
        readAt: null,
      },
    });
  }

  async markAllRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async listKeywords(userId: string) {
    return prisma.interestKeyword.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addKeyword(userId: string, keyword: string) {
    const normalized = normalizeKeyword(keyword);

    if (normalized.length < 2) {
      throw new Error('A palavra-chave deve ter pelo menos 2 caracteres.');
    }

    return prisma.interestKeyword.upsert({
      where: {
        userId_keyword: {
          userId,
          keyword: normalized,
        },
      },
      update: {},
      create: {
        userId,
        keyword: normalized,
      },
    });
  }

  async deleteKeyword(userId: string, id: string) {
    const item = await prisma.interestKeyword.findFirstOrThrow({
      where: { id, userId },
      select: { id: true },
    });

    return prisma.interestKeyword.delete({
      where: { id: item.id },
    });
  }
}

export default new NotificationService();
