import { Request, Response } from 'express';
import forumService from '../services/forum.service';

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export class ForumController {
  async listTopics(req: Request, res: Response) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const result = await forumService.listTopics(page, limit);
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Falha ao carregar tópicos.' });
    }
  }

  async getTopic(req: Request, res: Response) {
    try {
      const topic = await forumService.getTopic(req.params.id);
      if (!topic) return res.status(404).json({ error: 'Tópico não encontrado.' });
      res.json(topic);
    } catch {
      res.status(500).json({ error: 'Falha ao carregar tópico.' });
    }
  }

  async createTopic(req: Request, res: Response) {
    try {
      const authorId = (req as any).user?.id;
      const title = normalizeText(req.body.title);
      const content = normalizeText(req.body.content);

      if (!title || !content) {
        return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
      }
      if (title.length > 200) {
        return res.status(400).json({ error: 'Título muito longo (máx. 200 caracteres).' });
      }

      const topic = await forumService.createTopic(authorId, title, content);
      res.status(201).json(topic);
    } catch {
      res.status(500).json({ error: 'Falha ao criar tópico.' });
    }
  }

  async createAnswer(req: Request, res: Response) {
    try {
      const authorId = (req as any).user?.id;
      const content = normalizeText(req.body.content);

      if (!content) return res.status(400).json({ error: 'Conteúdo é obrigatório.' });

      const answer = await forumService.createAnswer(req.params.id, authorId, content);
      res.status(201).json(answer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar resposta.';
      res.status(message.includes('não encontrado') ? 404 : 500).json({ error: message });
    }
  }

  async deleteAnswer(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      await forumService.deleteAnswer(req.params.id, userId, userRole);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir resposta.';
      const status = message.includes('não encontrada') ? 404 : message.includes('permissão') ? 403 : 500;
      res.status(status).json({ error: message });
    }
  }

  async createComment(req: Request, res: Response) {
    try {
      const authorId = (req as any).user?.id;
      const content = normalizeText(req.body.content);

      if (!content) return res.status(400).json({ error: 'Conteúdo é obrigatório.' });

      const comment = await forumService.createComment(req.params.id, authorId, content);
      res.status(201).json(comment);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao criar comentário.';
      res.status(message.includes('não encontrada') ? 404 : 500).json({ error: message });
    }
  }

  async deleteComment(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      await forumService.deleteComment(req.params.id, userId, userRole);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao excluir comentário.';
      const status = message.includes('não encontrado') ? 404 : message.includes('permissão') ? 403 : 500;
      res.status(status).json({ error: message });
    }
  }
}

export default new ForumController();
