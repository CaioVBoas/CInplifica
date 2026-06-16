import { Router } from 'express';
import reviewController from '../controllers/review.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/users/:userId', reviewController.listForUser);
router.post('/', authMiddleware, reviewController.create);

export default router;
