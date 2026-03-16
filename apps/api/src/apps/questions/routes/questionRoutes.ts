import { Router } from 'express';
import { QuestionController } from '../controllers/QuestionController';
import { QuestionService } from '../service/QuestionService';
import { QuestionRepository } from '../repository/QuestionRepository';
import { authenticateToken, requireAdmin } from '../../../middleware/auth.middleware';
import { validateQuery, validateRequest } from '../../../middleware/validation';
import { createQuestionSchema, questionQuerySchema, updateQuestionSchema } from '../dto/question.dto';

const router: Router = Router();

const questionController = new QuestionController(
    new QuestionService(new QuestionRepository())
);

// All question routes require admin access
router.use(authenticateToken, requireAdmin);

// Question management routes
router.post('/', validateRequest(createQuestionSchema), questionController.createQuestion);
router.get('/', validateQuery(questionQuerySchema), questionController.getAllQuestions);
router.get('/search', validateQuery(questionQuerySchema), questionController.searchQuestions);
router.get('/:id', questionController.getQuestionById);
router.put('/:id', validateRequest(updateQuestionSchema), questionController.updateQuestion);
router.delete('/:id', questionController.deleteQuestion);
router.patch('/:id/toggle-status', questionController.toggleQuestionStatus);

export default router; 