import { Router } from 'express';
import listingController from '../controllers/listing.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', listingController.getAll);
router.post('/upload-image', authMiddleware, listingController.uploadImage);
router.get('/:id', listingController.getById);
router.post('/', authMiddleware, listingController.create);
router.patch('/:id', authMiddleware, listingController.update);
router.delete('/:id', authMiddleware, listingController.delete);

export default router;
