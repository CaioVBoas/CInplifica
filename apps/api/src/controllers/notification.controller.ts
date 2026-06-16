import { Request, Response } from 'express';
import { NotificationType } from '@prisma/client';
import notificationService from '../services/notification.service';

export class NotificationController {
  async list(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const notifications = await notificationService.list(userId);
    res.json(notifications);
  }

  async unreadCount(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const type = typeof req.query.type === 'string' && req.query.type in NotificationType
      ? NotificationType[req.query.type as keyof typeof NotificationType]
      : undefined;
    const count = await notificationService.unreadCount(userId, type);
    res.json({ count });
  }

  async markAllRead(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    await notificationService.markAllRead(userId);
    res.status(204).send();
  }

  async listKeywords(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const keywords = await notificationService.listKeywords(userId);
    res.json(keywords);
  }

  async addKeyword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const keyword = typeof req.body.keyword === 'string' ? req.body.keyword : '';
      const item = await notificationService.addKeyword(userId, keyword);
      res.status(201).json(item);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao cadastrar palavra-chave.';
      res.status(400).json({ error: message });
    }
  }

  async deleteKeyword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      await notificationService.deleteKeyword(userId, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Palavra-chave não encontrada.' });
      }
      return res.status(500).json({ error: 'Falha ao remover palavra-chave.' });
    }
  }
}

export default new NotificationController();
