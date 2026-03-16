import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../../middleware/auth.middleware';
import { CodeExecutionController } from '../controllers/CodeExecutionController';

const router: any = Router();
const codeExecutionController = new CodeExecutionController();

// Get all supported programming languages
router.get('/languages', authenticateToken, codeExecutionController.getSupportedLanguages.bind(codeExecutionController));

// Get language by ID
router.get('/languages/:id', authenticateToken, codeExecutionController.getLanguageById.bind(codeExecutionController));

// Submit code for execution
router.post('/submit', authenticateToken, codeExecutionController.submitCode.bind(codeExecutionController));

// Get execution result by token
router.get('/result/:token', authenticateToken, codeExecutionController.getExecutionResult.bind(codeExecutionController));

// Execute code and wait for result (synchronous)
router.post('/execute', authenticateToken, codeExecutionController.executeCode.bind(codeExecutionController));

export default router;
