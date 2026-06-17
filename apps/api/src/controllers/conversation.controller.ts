import { Request, Response } from 'express';
import conversationService from '../services/conversation.service';

const getErrorStatus = (message: string) => {
  if (message.includes('Acesso restrito')) return 403;
  if (message.includes('não encontrado') || message.includes('não encontrada')) return 404;
  return 400;
};

export class ConversationController {
  async getOrCreate(req: Request, res: Response) {
    try {
      const { participantId, listingId } = req.body;
      const currentUserId = (req as any).user?.id;

      if (!currentUserId || !participantId) {
        return res.status(400).json({ error: 'Informe o participante da conversa.' });
      }

      const conversation = await conversationService.getOrCreateConversation([
        currentUserId,
        participantId,
      ], typeof listingId === 'string' ? listingId : undefined);
      res.json(conversation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao iniciar conversa.';
      res.status(getErrorStatus(message)).json({ error: message });
    }
  }

  async listMyConversations(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      if (!currentUserId) return res.status(401).json({ error: 'Usuário não autenticado.' });

      const conversations = await conversationService.getUserConversations(currentUserId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Falha ao buscar conversas.' });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      const messages = await conversationService.getMessages(id, currentUserId);
      res.json(messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao buscar mensagens.';
      res.status(getErrorStatus(message)).json({ error: message });
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      if (!currentUserId) return res.status(401).json({ error: 'Usuário não autenticado.' });

      await conversationService.markConversationRead(id, currentUserId);
      res.status(204).send();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao marcar conversa como lida.';
      res.status(getErrorStatus(message)).json({ error: message });
    }
  }

  async unreadCount(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      if (!currentUserId) return res.status(401).json({ error: 'Usuário não autenticado.' });

      const count = await conversationService.getTotalUnreadCount(currentUserId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: 'Falha ao buscar mensagens não lidas.' });
    }
  }

  async complete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.id;
      if (!currentUserId) return res.status(401).json({ error: 'Usuário não autenticado.' });

      const conversation = await conversationService.completeConversation(id, currentUserId);
      res.json(conversation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao concluir bate-papo.';
      res.status(getErrorStatus(message)).json({ error: message });
    }
  }
}

export default new ConversationController();
