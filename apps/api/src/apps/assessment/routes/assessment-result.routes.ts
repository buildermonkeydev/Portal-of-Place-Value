import { Router } from 'express';
import { AssessmentResultController } from '../controllers/AssessmentResultController';
import { AssessmentResultService } from '../services/AssessmentResultService';
import { AssessmentResultRepository } from '../repository/AssessmentResultRepository';
import { AssessmentService } from '../services/AssessmentService';
import { AssessmentRepository } from '../repository/AssessmentRepository';
import { QuestionRepository } from '../../questions/repository/QuestionRepository';
import { QuestionService } from '../../questions/service/QuestionService';
import { UserService } from '../../users/services/UserService';
import EmailService from '../../../core/services/EmailService';
import { TestExecutionService } from '../../test/services/TestExecutionService';
import { authenticateToken, requireAdmin } from '../../../middleware/auth.middleware';
import { validateQuery, validateRequest } from '../../../middleware/validation';
import { assessmentResultQuerySchema, assessmentResultDateRangeQuerySchema, assessmentResultDateRangeWithPaginationQuerySchema, saveAnswerSchema, startAssessmentSchema, submitAssessmentSchema, submitCodingSolutionSchema } from '../dto/assessmentResult.dto';
import { exportRateLimiter } from '../../../middleware/exportRateLimit';


const router: Router = Router();

const assessmentResultController = new AssessmentResultController(
    new AssessmentResultService(
        new AssessmentResultRepository(),
        new AssessmentService(
            new AssessmentRepository(),
            new QuestionService(new QuestionRepository()),
            new UserService()
        ),
        new QuestionService(new QuestionRepository()),
        new EmailService(),
        new UserService(),
        new TestExecutionService()
    )
);

// Admin routes (viewing all results and statistics)
router.get('/', authenticateToken, requireAdmin, assessmentResultController.getAllResults);
router.get('/assessment/:id/results', authenticateToken, requireAdmin, assessmentResultController.getAssessmentResults);
router.get('/assessment/:id/results-detailed', authenticateToken, requireAdmin, assessmentResultController.getAssessmentResultsWithCollegeInfo);
router.get('/assessment/:id/statistics', authenticateToken, requireAdmin, assessmentResultController.getAssessmentStatistics);
// More specific routes first
router.get('/user/:userId/assessment', authenticateToken, requireAdmin, assessmentResultController.getResultByUserAndAssessment);
router.get('/user/:userId/assessments', authenticateToken, requireAdmin, assessmentResultController.getAssessmentsForUser);
router.get('/user/:userId/date-range/reports', authenticateToken, requireAdmin, validateQuery(assessmentResultDateRangeQuerySchema), assessmentResultController.getResultsByUserAndDateRangeForReports);
router.get('/user/:userId/date-range', authenticateToken, requireAdmin, validateQuery(assessmentResultDateRangeQuerySchema), assessmentResultController.getResultsByUserAndDateRange);
router.get('/user/:userId', authenticateToken, requireAdmin, assessmentResultController.getResultsByUser);
router.get('/user/:userId/export', authenticateToken, requireAdmin, validateQuery(assessmentResultDateRangeQuerySchema), assessmentResultController.exportResultsByUserAndDateRange);
router.post('/', authenticateToken, requireAdmin, assessmentResultController.createResult);
router.post('/export', authenticateToken, requireAdmin, assessmentResultController.exportResults);
router.post('/auto-fail-expired', authenticateToken, requireAdmin, assessmentResultController.autoFailExpiredAssessments);
router.post('/assessment/:id/recalculate-scores', authenticateToken, requireAdmin, assessmentResultController.recalculateAssessmentScores);
router.post('/:id/recalculate', authenticateToken, requireAdmin, assessmentResultController.recalculateResultScores);

// User routes (authenticated users taking assessments) - must come before /:id routes
router.post('/start', authenticateToken, validateRequest(startAssessmentSchema), assessmentResultController.startAssessment);
router.post('/submit', authenticateToken, validateRequest(submitAssessmentSchema), assessmentResultController.submitAssessment);
router.post('/pause', authenticateToken, assessmentResultController.pauseAssessment);
router.post('/save-answer', authenticateToken, validateRequest(saveAnswerSchema), assessmentResultController.saveAnswer);
router.delete('/clear-answer/:id', authenticateToken, assessmentResultController.clearAnswer);
router.post('/submit-coding-solution', authenticateToken, validateRequest(submitCodingSolutionSchema), assessmentResultController.submitCodingSolution);

router.get('/my/results', authenticateToken, validateQuery(assessmentResultQuerySchema), assessmentResultController.getMyResults);
router.get('/my/results-for-reports', authenticateToken, assessmentResultController.getMyResultsForReports);
router.get('/my/results/date-range', authenticateToken, validateQuery(assessmentResultDateRangeWithPaginationQuerySchema), assessmentResultController.getMyResultsByDateRange);
router.get('/my/results/export', authenticateToken, validateQuery(assessmentResultDateRangeQuerySchema), exportRateLimiter, assessmentResultController.exportMyResultsByDateRange);

router.get('/my/results/:id', authenticateToken, assessmentResultController.getMyAssessmentResult);
router.get('/on-going/:id', authenticateToken, assessmentResultController.getOnGoingAssessmentResult);

router.get('/state/:id', authenticateToken, assessmentResultController.getCurrentAssessmentState);
router.get('/questions/:id', authenticateToken, assessmentResultController.getAssessmentQuestions);
router.get('/resume/:id', authenticateToken, assessmentResultController.resumeAssessment);

// ID-based routes - must come last
router.get('/take/:assessmentId', authenticateToken, requireAdmin, assessmentResultController.getResultByAssessmentId);

router.get('/:id', authenticateToken, requireAdmin, assessmentResultController.getResultById);
router.get('/:id/detailed', authenticateToken, assessmentResultController.getDetailedAssessmentResult);
router.post('/:id/send-report', authenticateToken, requireAdmin, assessmentResultController.sendIndividualReport);
router.put('/:id', authenticateToken, requireAdmin, assessmentResultController.updateResult);
router.delete('/:id', authenticateToken, requireAdmin, assessmentResultController.deleteResult);

export default router; 