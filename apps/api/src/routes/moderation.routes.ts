import { Router } from 'express';
import moderationController from '../controllers/moderation.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'MODERATOR']));

router.get('/actions', moderationController.listActions);
router.post('/reports/:id/approve', moderationController.approveReport);
router.post('/reports/:id/reject', moderationController.rejectReport);
router.post('/content/remove', moderationController.removeContent);
router.post('/users/:id/suspend', moderationController.suspendUser);

export default router;
