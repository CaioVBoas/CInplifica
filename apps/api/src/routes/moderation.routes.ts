import { Router } from 'express';
import moderationController from '../controllers/moderation.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'MODERATOR']));

router.get('/actions', moderationController.listActions.bind(moderationController));
router.post('/reports/:id/approve', moderationController.approveReport.bind(moderationController));
router.post('/reports/:id/reject', moderationController.rejectReport.bind(moderationController));
router.post('/content/remove', moderationController.removeContent.bind(moderationController));
router.post('/users/:id/suspend', moderationController.suspendUser.bind(moderationController));

export default router;
