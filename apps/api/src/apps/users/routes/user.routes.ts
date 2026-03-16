import { Router } from 'express';

import {
    createUserSchema,
    updateUserSchema,
    loginSchema,
    changePasswordSchema,
    userQuerySchema,
    emailVerificationSchema,
    updateUserRoleSchema,
    bulkDeleteUsersSchema,
    bulkUpdateUserRolesSchema,
    bulkAssignAssessmentSchema,
    importUsersSchema,
    bulkDisableUsersWithFiltersSchema,
    bulkEnableUsersWithFiltersSchema
} from '../dto/user.dto';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { authenticateToken, requireAdmin } from '../../../middleware/auth.middleware';
import { validateQuery, validateRequest } from '../../../middleware/validation';
import { inviteUsersSchema } from '../dto/invitation.dto';
import upload from '../../../middleware/fileUpload';

const router: Router = Router();

const userController = new UserController(
    new UserService()
)
// User profile routes
router.put('/profile', authenticateToken, validateRequest(updateUserSchema), userController.updateProfile);
router.put('/change-password', authenticateToken, validateRequest(changePasswordSchema), userController.changePassword);

// Admin routes - utility routes must come before /:id routes
router.get('/users', authenticateToken, requireAdmin, validateQuery(userQuerySchema), userController.getAllUsers);
router.get('/users/search', authenticateToken, requireAdmin, userController.searchUsers);
router.post('/users', authenticateToken, requireAdmin, validateRequest(createUserSchema), userController.createUser);
router.post('/users/bulk-delete', authenticateToken, requireAdmin, validateRequest(bulkDeleteUsersSchema), userController.bulkDeleteUsers);
router.post('/users/bulk-role-update', authenticateToken, requireAdmin, validateRequest(bulkUpdateUserRolesSchema), userController.bulkUpdateUserRoles);
router.post('/users/bulk-assign-assessment', authenticateToken, requireAdmin, validateRequest(bulkAssignAssessmentSchema), userController.bulkAssignAssessment);
router.post('/users/bulk-disable', authenticateToken, requireAdmin, validateRequest(bulkDisableUsersWithFiltersSchema), userController.bulkDisableUsersWithFilters);
router.post('/users/bulk-enable', authenticateToken, requireAdmin, validateRequest(bulkEnableUsersWithFiltersSchema), userController.bulkEnableUsersWithFilters);
router.post('/users/export', authenticateToken, requireAdmin, userController.exportUsers);
router.post('/users/import', authenticateToken, requireAdmin, validateRequest(importUsersSchema), userController.importUsers);

// Invitation routes (admin only)
router.post('/users/invite', authenticateToken, requireAdmin, validateRequest(inviteUsersSchema), userController.sendRegistrationInvitations);
router.post('/users/invite/file', authenticateToken, requireAdmin, upload.single('file'), userController.sendRegistrationInvitationsFromFile);

// ID-based routes - must come last
router.get('/users/:id', authenticateToken, requireAdmin, userController.getUserById);
router.put('/users/:id', authenticateToken, requireAdmin, validateRequest(updateUserSchema), userController.updateUserById);
router.delete('/users/:id/full', authenticateToken, requireAdmin, userController.deleteUserAndData);
router.delete('/users/:id', authenticateToken, requireAdmin, userController.deleteUserById);
router.put('/users/:id/deactivate', authenticateToken, requireAdmin, userController.deactivateUser);
router.put('/users/:id/activate', authenticateToken, requireAdmin, userController.activateUser);
router.patch('/users/:id/role', authenticateToken, requireAdmin, validateRequest(updateUserRoleSchema), userController.updateUserRole);
router.get('/users/:id/assessments', authenticateToken, requireAdmin, userController.getUserAssessments);
router.get('/users/:id/results', authenticateToken, requireAdmin, userController.getUserResults);

export default router; 