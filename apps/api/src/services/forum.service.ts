import prisma from './prisma';

const authorSelect = { id: true, name: true, email: true, picture: true };

export class ForumService {
  async listTopics(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [topics, total] = await Promise.all([
      prisma.forumTopic.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: authorSelect },
          _count: { select: { answers: true } },
        },
      }),
      prisma.forumTopic.count(),
    ]);

    return { data: topics, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTopic(id: string) {
    return prisma.forumTopic.findUnique({
      where: { id },
      include: {
        author: { select: authorSelect },
        answers: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: authorSelect },
            comments: {
              orderBy: { createdAt: 'asc' },
              include: { author: { select: authorSelect } },
            },
          },
        },
      },
    });
  }

  async createTopic(authorId: string, title: string, content: string) {
    return prisma.forumTopic.create({
      data: { title, content, authorId },
      include: { author: { select: authorSelect } },
    });
  }

  async createAnswer(topicId: string, authorId: string, content: string) {
    const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
    if (!topic) throw new Error('Tópico não encontrado.');

    return prisma.forumAnswer.create({
      data: { content, topicId, authorId },
      include: {
        author: { select: authorSelect },
        comments: { include: { author: { select: authorSelect } } },
      },
    });
  }

  async deleteAnswer(id: string, userId: string, userRole: string) {
    const answer = await prisma.forumAnswer.findUnique({ where: { id } });
    if (!answer) throw new Error('Resposta não encontrada.');

    const isOwner = answer.authorId === userId;
    const canModerate = userRole === 'ADMIN' || userRole === 'MODERATOR';
    if (!isOwner && !canModerate) throw new Error('Sem permissão para excluir esta resposta.');

    await prisma.forumAnswer.delete({ where: { id } });
  }

  async createComment(answerId: string, authorId: string, content: string) {
    const answer = await prisma.forumAnswer.findUnique({ where: { id: answerId } });
    if (!answer) throw new Error('Resposta não encontrada.');

    return prisma.forumComment.create({
      data: { content, answerId, authorId },
      include: { author: { select: authorSelect } },
    });
  }

  async deleteComment(id: string, userId: string, userRole: string) {
    const comment = await prisma.forumComment.findUnique({ where: { id } });
    if (!comment) throw new Error('Comentário não encontrado.');

    const isOwner = comment.authorId === userId;
    const canModerate = userRole === 'ADMIN' || userRole === 'MODERATOR';
    if (!isOwner && !canModerate) throw new Error('Sem permissão para excluir este comentário.');

    await prisma.forumComment.delete({ where: { id } });
  }
}

export default new ForumService();
