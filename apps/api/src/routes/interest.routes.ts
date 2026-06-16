import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/keywords', notificationController.listKeywords);
router.post('/keywords', notificationController.addKeyword);
router.delete('/keywords/:id', notificationController.deleteKeyword);

export default router;
