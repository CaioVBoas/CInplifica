import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const moderationOnly = requireRole(['ADMIN', 'MODERATOR']);

router.use(authMiddleware);

router.post('/', reportController.create);
router.get('/', moderationOnly, reportController.list);
router.patch('/:id/status', moderationOnly, reportController.updateStatus);

export default router;
