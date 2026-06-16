import { Request, Response } from 'express';
import reviewService from '../services/review.service';
import auditLogService from '../services/audit-log.service';

const normalizeComment = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export class ReviewController {
  async listForUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const result = await reviewService.listForUser(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao buscar avaliações.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const reviewerId = (req as any).user?.id;
      const { reviewedUserId, conversationId, rating, comment } = req.body;

      if (!reviewerId || !reviewedUserId || !conversationId) {
        return res.status(400).json({ error: 'Informe conversa e usuário avaliado.' });
      }

      const review = await reviewService.create({
        reviewerId,
        reviewedUserId,
        conversationId,
        rating: Number(rating),
        comment: normalizeComment(comment),
      });

      await auditLogService.create({
        action: 'REVIEW_CREATED',
        entityType: 'Review',
        entityId: review.id,
        actorId: reviewerId,
        metadata: {
          reviewedUserId,
          conversationId,
          rating: review.rating,
        },
      });

      res.status(201).json(review);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar avaliação.';
      const status = message.includes('não encontrada') ? 404 : 400;
      res.status(status).json({ error: message });
    }
  }
}

export default new ReviewController();
