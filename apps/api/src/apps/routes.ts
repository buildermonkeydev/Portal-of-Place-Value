import { Router } from 'express';
import userRoutes from './users/routes/user.routes';
import authRoutes from './users/routes/auth.routes';
import questionRoutes from './questions/routes/questionRoutes';
import assessmentResultRoutes from './assessment/routes/assessment-result.routes';
import assessmentRoutes from './assessment/routes/assessment.routes';

import dashboardRoutes from './dashboard/routes/dashboardRoutes';
import collegeRoutes from './college/routes/collegeRoutes';
import branchRoutes from './college/routes/branchRoutes';
import codeExecutionRoutes from './test/routes/codeExecutionRoutes';
import testRoutes from './test/routes/test.routes';
import { IRequest, IResponse } from '../core/types';
import { logger } from '../utils/logger';
import { mailQueueRoutes } from './mail.queue.routes';

logger.info('Loading route modules...', 'Routes');

const router: Router = Router();

// API version prefix
const API_VERSION = '/api/v1';

// Health check route
router.get('/health', (_req: IRequest, res: IResponse): void => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

router.use(`${API_VERSION}/user`, userRoutes);

router.use(`${API_VERSION}/auth`, authRoutes);

router.use(`${API_VERSION}/questions`, questionRoutes);

router.use(`${API_VERSION}/assessments`, assessmentRoutes);

router.use(`${API_VERSION}/assessment-results`, assessmentResultRoutes);

router.use(`${API_VERSION}/dashboard`, dashboardRoutes);

router.use(`${API_VERSION}/colleges`, collegeRoutes);

router.use(`${API_VERSION}/branches`, branchRoutes);

router.use(`${API_VERSION}/code-execution`, codeExecutionRoutes);

router.use(`${API_VERSION}/tests`, testRoutes);

router.use(`${API_VERSION}/mail-queue`, mailQueueRoutes);

logger.info('All routes configured successfully', 'Routes');

export default router; 