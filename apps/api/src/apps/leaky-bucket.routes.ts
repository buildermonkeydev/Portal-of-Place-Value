import { Router } from 'express';
import { leakyBucketController } from './LeakyBucketController';
import { authenticateToken } from '../middleware/auth.middleware';

const router: Router = Router();

// Public routes (no authentication required)
router.get('/stats', leakyBucketController.getStats);
router.get('/health', leakyBucketController.getHealth);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/config', leakyBucketController.updateConfig);
router.post('/clear-queue', leakyBucketController.clearQueue);

export { router as leakyBucketRoutes };
