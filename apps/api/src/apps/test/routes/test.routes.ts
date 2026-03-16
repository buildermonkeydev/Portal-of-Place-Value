import { Router } from 'express';
import { TestController } from '../controllers/TestController';
import { authenticateToken, requireAdmin } from '../../../middleware/auth.middleware';
import { validateQuery, validateRequest } from '../../../middleware/validation';
import { submissionRateLimiter, validateSubmission } from '../../../middleware/submissionRateLimit';
import { createTestSchema, testQuerySchema, testSubmissionSchema, updateTestSchema } from '../dto/test.dto';
const router: Router = Router();

const testController = new TestController();

// Bind methods to preserve 'this' context
router.post('/', authenticateToken, requireAdmin, validateRequest(createTestSchema), testController.createTest.bind(testController));
router.get('/admin', authenticateToken, requireAdmin, validateQuery(testQuerySchema), testController.getAllTests.bind(testController));
router.get('/admin/:id', authenticateToken, requireAdmin, testController.getTestById.bind(testController));
router.put('/admin/:id', authenticateToken, requireAdmin, validateRequest(updateTestSchema), testController.updateTest.bind(testController));
router.delete('/admin/:id', authenticateToken, requireAdmin, testController.deleteTest.bind(testController));
router.patch('/admin/:id/publish', authenticateToken, requireAdmin, testController.publishTest.bind(testController));
router.patch('/admin/:id/archive', authenticateToken, requireAdmin, testController.archiveTest.bind(testController));
router.get('/admin/:id/submissions', authenticateToken, requireAdmin, testController.getTestSubmissions.bind(testController));
router.get('/admin/:id/stats', authenticateToken, requireAdmin, testController.getTestSubmissionStats.bind(testController));
router.get('/admin/stats/overview', authenticateToken, requireAdmin, testController.getTestStats.bind(testController));
router.get('/admin/creator/:creatorId', authenticateToken, requireAdmin, validateQuery(testQuerySchema), testController.getTestsByCreator.bind(testController));

// Public routes for users
router.get('/', validateQuery(testQuerySchema), testController.getPublishedTests.bind(testController));
router.get('/search', validateQuery(testQuerySchema), testController.searchTests.bind(testController));

// Get supported languages for a test (BEFORE /:id route to avoid conflicts)
router.get('/:id/languages', testController.getSupportedLanguages.bind(testController));

router.get('/:id', testController.getTestByIdForUser.bind(testController));

// Authenticated user routes
router.get('/my/assigned', authenticateToken, validateQuery(testQuerySchema), testController.getAssignedTests.bind(testController));

// CODE SUBMISSION - with rate limiting (10/min per user)
router.post('/:id/submit',
    authenticateToken,
    submissionRateLimiter,  // Rate limit: 10 submissions/min
    validateSubmission,      // Basic validation
    validateRequest(testSubmissionSchema),
    testController.submitTestSolution.bind(testController)
);

// TEST ENDPOINT - NO RATE LIMITING (for load testing, k6, development)
// WARNING: Use carefully, should be disabled in production or require admin role
router.post('/:id/submit-test',
    authenticateToken,
    validateSubmission,      // Still validates input
    validateRequest(testSubmissionSchema),
    testController.submitTestSolution.bind(testController)
);

router.get('/:id/submissions', authenticateToken, testController.getUserSubmissionHistory.bind(testController));

// Get submission status
router.get('/submissions/:submissionId/status', authenticateToken, testController.getSubmissionStatus.bind(testController));

// Report routes
router.get('/reports/student', authenticateToken, testController.getStudentReport.bind(testController));
router.get('/reports/admin/:userId', authenticateToken, requireAdmin, testController.getAdminStudentReport.bind(testController));

export default router;
