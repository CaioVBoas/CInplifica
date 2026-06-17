import { Router } from 'express';
import auditLogController from '../controllers/audit-log.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'MODERATOR']));

router.get('/', auditLogController.list.bind(auditLogController));

export default router;
