import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { UserRepository } from '../../users/repository/UserRepository';
import { AssessmentRepository } from '../../assessment/repository/AssessmentRepository';
import { AssessmentResultRepository } from '../../assessment/repository/AssessmentResultRepository';
import { QuestionRepository } from '../../questions/repository/QuestionRepository';
import { authenticateToken, requireAdmin } from '../../../middleware/auth.middleware';

const router: Router = Router();

const dashboardController = new DashboardController(
    new UserRepository(),
    new AssessmentRepository(),
    new AssessmentResultRepository(),
    new QuestionRepository()
);

// Dashboard statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, dashboardController.getDashboardStats);

export default router; 