import { Router } from 'express';
import { queueController } from './QueueController';

const router: Router = Router();

// Public routes (no authentication required)
router.get('/stats', queueController.getStats);
router.get('/health', queueController.getHealth);

export { router as queueRoutes };
