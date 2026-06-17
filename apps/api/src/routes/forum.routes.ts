import { Router } from 'express';
import forumController from '../controllers/forum.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/topics', authMiddleware, forumController.listTopics);
router.post('/topics', authMiddleware, forumController.createTopic);
router.get('/topics/:id', authMiddleware, forumController.getTopic);
router.post('/topics/:id/answers', authMiddleware, forumController.createAnswer);
router.delete('/answers/:id', authMiddleware, forumController.deleteAnswer);
router.post('/answers/:id/comments', authMiddleware, forumController.createComment);
router.delete('/comments/:id', authMiddleware, forumController.deleteComment);

export default router;
