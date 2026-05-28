import { Router } from 'express';
import conversationController from '../controllers/conversation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', conversationController.listMyConversations);
router.post('/', conversationController.getOrCreate);
router.get('/:id/messages', conversationController.getMessages);

export default router;
