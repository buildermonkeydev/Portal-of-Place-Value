import { Router } from 'express';
import { AssessmentController } from '../controllers/AssessmentController';
import { AssessmentService } from '../services/AssessmentService';
import { QuestionRepository } from '../../questions/repository/QuestionRepository';
import { AssessmentRepository } from '../repository/AssessmentRepository';
import { authenticateToken, requireAdmin } from '../../../middleware/auth.middleware';
import { QuestionService } from '../../questions/service/QuestionService';
import { UserService } from '../../users/services/UserService';
import { validateQuery, validateRequest } from '../../../middleware/validation';
import { assessmentQuerySchema, createAssessmentSchema, updateAssessmentSchema } from '../dto/assessment.dto';
import { createQuestionSchema, updateQuestionSchema } from '../../questions/dto/question.dto';

const router: Router = Router();

const assessmentController = new AssessmentController(
    new AssessmentService(
        new AssessmentRepository(),
        new QuestionService(new QuestionRepository()),
        new UserService()
    )
);

// Admin-only routes
router.post('/', authenticateToken, requireAdmin, validateRequest(createAssessmentSchema), assessmentController.createAssessment.bind(assessmentController));

router.put('/update-question/:questionId', authenticateToken, requireAdmin, validateRequest(updateQuestionSchema), assessmentController.updateQuestion.bind(assessmentController));
router.post('/create-question/:assessmentId', authenticateToken, requireAdmin, validateRequest(createQuestionSchema), assessmentController.createQuestionInAssessment.bind(assessmentController));
router.get('/', authenticateToken, requireAdmin, validateQuery(assessmentQuerySchema), assessmentController.getAllAssessments.bind(assessmentController));
router.get('/search', authenticateToken, requireAdmin, validateQuery(assessmentQuerySchema), assessmentController.searchAssessments.bind(assessmentController));

router.get('/user/:id', authenticateToken, assessmentController.getMyAssessmentById.bind(assessmentController));
router.get('/my/assessments', authenticateToken, assessmentController.getMyAssessments.bind(assessmentController));
router.get('/my/available-assessments', authenticateToken, assessmentController.getMyAvailableAssessments.bind(assessmentController));

// router.get('/:id/with-questions', authenticateToken, assessmentController.getAssessmentByIdWithQuestions);
router.get('/:id/with-questions', authenticateToken, assessmentController.getAssessmentByIdWithQuestions.bind(assessmentController));
router.get('/start/:resultId/with-questions', authenticateToken, assessmentController.getAssessmentByResultIdIdWithQuestions.bind(assessmentController));

router.get('/:id', authenticateToken, requireAdmin, assessmentController.getAssessmentById.bind(assessmentController));
router.get('/my/:id', authenticateToken, assessmentController.getAssessmentById.bind(assessmentController));
router.put('/:id', authenticateToken, requireAdmin, validateRequest(updateAssessmentSchema), assessmentController.updateAssessment.bind(assessmentController));
router.delete('/:id', authenticateToken, requireAdmin, assessmentController.deleteAssessment.bind(assessmentController));
router.patch('/:id/activate', authenticateToken, requireAdmin, assessmentController.activateAssessment.bind(assessmentController));
router.patch('/:id/clone', authenticateToken, requireAdmin, assessmentController.cloneAssessment.bind(assessmentController));
router.patch('/:id/deactivate', authenticateToken, requireAdmin, assessmentController.deactivateAssessment.bind(assessmentController));
router.post('/:id/assign-users', authenticateToken, requireAdmin, assessmentController.assignUsersToAssessment.bind(assessmentController));
router.get('/:id/stats', authenticateToken, requireAdmin, assessmentController.getAssessmentStats.bind(assessmentController));
router.get('/:id/success', authenticateToken, assessmentController.getAssessmentSuccess.bind(assessmentController));

export default router; 