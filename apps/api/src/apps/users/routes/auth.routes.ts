import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { validateRequest } from '../../../middleware/validation';
import { createUserSchema, emailVerificationSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from '../../../core/types';
import { authenticateToken } from '../../../middleware/auth.middleware';
const router: Router = Router();

const userController = new UserController(
    new UserService()
)
// Public routes
router.post('/register', validateRequest(createUserSchema), userController.register);
router.post('/login', validateRequest(loginSchema), userController.login);
router.post('/verify-email', validateRequest(emailVerificationSchema), userController.verifyEmail);
router.post('/resend-verification', userController.resendVerificationEmail);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), userController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), userController.resetPassword);
router.post('/refresh-token', userController.refreshToken);

router.get('/profile', authenticateToken, userController.getProfile);

export default router; 