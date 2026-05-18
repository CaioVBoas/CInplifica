import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import conversationService from '../services/conversation.service';

export class ConversationController {
  async getOrCreate(req: Request, res: Response) {
    try {
      const { participantId } = req.body;
      const currentUserId = (req as any).user?.id;

      if (!currentUserId || !participantId) {
        return res.status(400).json({ error: 'Missing participant ID' });
      }

      const conversation = await conversationService.getOrCreateConversation([
        currentUserId,
        participantId,
      ]);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to manage conversation' });
    }
  }

  async listMyConversations(req: Request, res: Response) {
    try {
      const currentUserId = (req as any).user?.id;
      if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

      const conversations = await conversationService.getUserConversations(currentUserId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const messages = await conversationService.getMessages(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
}

export default new ConversationController();
