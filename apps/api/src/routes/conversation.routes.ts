import { Router } from 'express';
import conversationController from '../controllers/conversation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', conversationController.listMyConversations);
router.get('/unread-count', conversationController.unreadCount);
router.post('/', conversationController.getOrCreate);
router.post('/:id/complete', conversationController.complete);
router.post('/:id/read', conversationController.markRead);
router.get('/:id/messages', conversationController.getMessages);

export default router;
