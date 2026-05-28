import prisma from './prisma';

export class ConversationService {
  async getOrCreateConversation(userIds: string[]) {
    // Check if a conversation between these exact users already exists
    // This is a simplified check for 1-on-1 for now
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: userIds.map((id) => ({
          users: { some: { id } },
        })),
      },
      include: {
        users: {
          select: { id: true, name: true },
        },
      },
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        users: {
          connect: userIds.map((id) => ({ id })),
        },
      },
      include: {
        users: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: {
        users: { some: { id: userId } },
      },
      include: {
        users: {
          select: { id: true, name: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async getMessages(conversationId: string) {
    return prisma.message.findMany({
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
  }

  async sendMessage(conversationId: string, senderId: string, text: string) {
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

    // Update conversation updatedAt for sorting
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}

export default new ConversationService();
