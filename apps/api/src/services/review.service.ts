import prisma from './prisma';

export interface CreateReviewData {
  reviewerId: string;
  reviewedUserId: string;
  conversationId: string;
  rating: number;
  comment?: string | null;
}

export class ReviewService {
  async listForUser(userId: string) {
    const reviews = await prisma.review.findMany({
      where: { reviewedUserId: userId },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        listing: {
          select: { id: true, title: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const averageRating =
      reviews.length === 0
        ? null
        : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return {
      averageRating,
      total: reviews.length,
      reviews,
    };
  }

  async create(data: CreateReviewData) {
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      throw new Error('A nota deve ser entre 1 e 5 estrelas.');
    }

    if (data.reviewerId === data.reviewedUserId) {
      throw new Error('Você não pode avaliar a si mesmo.');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      include: {
        users: {
          select: { id: true },
        },
      },
    });

    if (!conversation) {
      throw new Error('Conversa não encontrada.');
    }

    if (conversation.status !== 'COMPLETED') {
      throw new Error('A avaliação só é liberada após a conclusão da negociação.');
    }

    const participantIds = conversation.users.map((user) => user.id);
    if (!participantIds.includes(data.reviewerId) || !participantIds.includes(data.reviewedUserId)) {
      throw new Error('Apenas participantes da negociação podem avaliar.');
    }

    return prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        reviewerId: data.reviewerId,
        reviewedUserId: data.reviewedUserId,
        conversationId: data.conversationId,
        listingId: conversation.listingId,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, email: true },
        },
        reviewedUser: {
          select: { id: true, name: true, email: true },
        },
        listing: {
          select: { id: true, title: true, category: true },
        },
      },
    });
  }
}

export default new ReviewService();
