import { IRequest, IResponse } from "../../../core/types";
import { asyncHandler } from "../../../utils/errors";
import { throwUserNotFoundError, throwValidationError } from "../../../utils/errorUtils";
import { logger } from "../../../utils/logger";
import { ResponseUtils } from "../../../utils/responseUtils";
import { UserService } from "../services/UserService";


export class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    // Register new user
    register = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userData = req.body;
        const newUser = await this.userService.createUser(userData);

        ResponseUtils.created(res, newUser, 'User registered successfully');
    });

    // Login user
    login = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const loginData = req.body;
        const result = await this.userService.login(loginData);

        ResponseUtils.success(res, {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        }, 'Login successful');
    });

    // Get current user profile (with caching)
    getProfile = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + ""
        const forceRefresh = req.query.forceRefresh === 'true';

        const user = await this.userService.getUserById(userId, forceRefresh);

        if (!user) {
            throwUserNotFoundError(userId);
        }

        ResponseUtils.success(res, user, 'Profile retrieved successfully');
    });

    // Update user profile (with cache invalidation)
    updateProfile = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const updateData = req.body;

        console.log('UpdateProfile - User ID:', userId);
        console.log('UpdateProfile - Update Data:', updateData);
        console.log('UpdateProfile - Request Body:', req.body);

        const updatedUser = await this.userService.updateProfile(userId, updateData);

        if (!updatedUser) {
            throwUserNotFoundError(userId);
        }


        logger.info(`User profile updated and cache invalidated for user: ${userId}`);

        console.log('UpdateProfile - Updated User:', updatedUser);

        ResponseUtils.success(res, updatedUser, 'Profile updated successfully');
    });

    // Change password
    changePassword = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const changePasswordData = req.body;

        await this.userService.changePassword(userId, changePasswordData);

        ResponseUtils.success(res, null, 'Password changed successfully');
    });

    // Get all users (admin only)
    getAllUsers = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const page = parseInt(req.query['page'] as string) || 1;
        const limit = parseInt(req.query['limit'] as string) || 10;
        const filter: any = {};

        // Apply filters
        if (req.query['role']) {
            filter.role = req.query['role'];
        }
        if (req.query['isActive'] !== undefined) {
            filter.isActive = req.query['isActive'] === 'true';
        }

        // Handle search parameter separately to avoid casting issues
        const search = req.query['search'];

        // Log the search parameter for debugging
        console.log('Search parameter received:', search, 'Type:', typeof search);

        // Validate search parameter to prevent casting errors
        if (search && typeof search === 'string' && search.trim()) {
            // Only add search if it's a valid string
            console.log('Using search-based query with:', search.trim());
            const result = await this.userService.getAllUsers(page, limit, search.trim());
            ResponseUtils.paginated(res, result.users, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Users retrieved successfully');
        } else {
            // No search, use filter-based approach
            console.log('Using filter-based query with:', filter);
            const result = await this.userService.getAllUsersWithFilter(page, limit, filter);
            ResponseUtils.paginated(res, result.users, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Users retrieved successfully');
        }
    });

    // Get user by ID (admin only)
    getUserById = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const user = await this.userService.getUserById(userId);

        if (!user) {
            throwUserNotFoundError(userId);
        }

        ResponseUtils.success(res, user, 'User retrieved successfully');
    });

    // Update user by ID (admin only)
    updateUserById = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const updateData = req.body;
        const requestingUserRole = req.user?.role;

        const updatedUser = await this.userService.updateUser(userId, updateData, requestingUserRole);

        if (!updatedUser) {
            throwUserNotFoundError(userId);
        }

        ResponseUtils.success(res, updatedUser, 'User updated successfully');
    });

    // Delete user by ID (admin only)
    deleteUserById = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const success = await this.userService.deleteUser(userId);

        if (!success) {
            throwUserNotFoundError(userId);
        }

        ResponseUtils.success(res, null, 'User deleted successfully');
    });

    deleteUserAndData = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const performedBy = req.user?._id ? String(req.user?._id) : undefined;

        const result = await this.userService.deleteUserAndData(userId, performedBy);

        ResponseUtils.success(res, result, 'User and associated data soft deleted successfully');
    });

    // Search users (admin only)
    searchUsers = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const searchTerm = req.query['search'] as string;
        const page = parseInt(req.query['page'] as string) || 1;
        const limit = parseInt(req.query['limit'] as string) || 10;

        if (!searchTerm) {
            throwValidationError('Search term is required');
        }

        const users = await this.userService.getAllUsers(page, limit, searchTerm);

        ResponseUtils.paginated(res, users.users, {
            page: users.page,
            limit: users.limit,
            total: users.total,
            totalPages: users.totalPages
        }, 'Search completed successfully');
    });

    // Deactivate user (admin only)
    deactivateUser = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const success = await this.userService.toggleUserStatus(userId);

        if (!success) {
            throwUserNotFoundError(userId);
        }

        ResponseUtils.success(res, null, 'User deactivated successfully');
    });

    // Activate user (admin only)
    activateUser = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const success = await this.userService.toggleUserStatus(userId);

        if (!success) {
            throwUserNotFoundError(userId);
        }

        ResponseUtils.success(res, null, 'User activated successfully');
    });

    // Verify email
    verifyEmail = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { token } = req.body;
        const success = await this.userService.verifyEmail(token);

        if (!success) {
            throwValidationError('Email verification failed');
        }

        ResponseUtils.success(res, null, 'Email verified successfully');
    });

    // Resend verification email
    resendVerificationEmail = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { email } = req.body;
        const success = await this.userService.resendVerificationEmail(email);

        if (!success) {
            throwValidationError('Failed to resend verification email');
        }

        ResponseUtils.success(res, null, 'Verification email sent successfully');
    });

    // Forgot password
    forgotPassword = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { email } = req.body;
        const result = await this.userService.forgotPassword(email);

        ResponseUtils.success(res, null, result.message);
    });

    // Reset password
    resetPassword = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { token, newPassword } = req.body;
        const result = await this.userService.resetPassword(token, newPassword);

        ResponseUtils.success(res, null, result.message);
    });

    // Refresh access token
    refreshToken = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throwValidationError('Refresh token is required');
        }

        const result = await this.userService.refreshToken(refreshToken);

        ResponseUtils.success(res, {
            accessToken: result.accessToken,
        }, 'Token refreshed successfully');
    });

    // Update user role (admin only)
    updateUserRole = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const { role } = req.body;
        const requestingUserRole = req.user?.role;

        const updatedUser = await this.userService.updateUserRole(userId, role, requestingUserRole);

        if (!updatedUser) {
            throwUserNotFoundError(userId);
        }

        ResponseUtils.success(res, updatedUser, 'User role updated successfully');
    });

    // Get user assessments (admin only)
    getUserAssessments = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const assessments = await this.userService.getUserAssessments(userId);

        ResponseUtils.success(res, assessments, 'User assessments retrieved successfully');
    });

    // Get user results (admin only)
    getUserResults = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['id'] as string;
        const results = await this.userService.getUserResults(userId);

        ResponseUtils.success(res, results, 'User results retrieved successfully');
    });

    // Bulk delete users (admin only)
    bulkDeleteUsers = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            throwValidationError('User IDs array is required and must not be empty');
        }

        const result = await this.userService.bulkDeleteUsers(userIds);

        ResponseUtils.success(res, result, 'Users deleted successfully');
    });

    // Bulk update user roles (admin only)
    bulkUpdateUserRoles = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { userIds, role } = req.body;
        const requestingUserRole = req.user?.role;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            throwValidationError('User IDs array is required and must not be empty');
        }

        if (!role) {
            throwValidationError('Role is required');
        }

        const result = await this.userService.bulkUpdateUserRoles(userIds, role, requestingUserRole);

        ResponseUtils.success(res, result, 'User roles updated successfully');
    });

    // Bulk assign assessment (admin only)
    bulkAssignAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { userIds, assessmentId } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            throwValidationError('User IDs array is required and must not be empty');
        }

        if (!assessmentId) {
            throwValidationError('Assessment ID is required');
        }

        const result = await this.userService.bulkAssignAssessment(userIds, assessmentId);

        ResponseUtils.success(res, result, 'Assessment assigned to users successfully');
    });

    // Export users (admin only)
    exportUsers = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const result = await this.userService.exportUsers();

        ResponseUtils.success(res, result, 'Users exported successfully');
    });

    // Import users (admin only)
    importUsers = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { users } = req.body;
        const requestingUserRole = req.user?.role;

        if (!users || !Array.isArray(users) || users.length === 0) {
            throwValidationError('Users array is required and must not be empty');
        }

        const result = await this.userService.importUsers(users, requestingUserRole);

        ResponseUtils.success(res, result, 'Users imported successfully');
    });

    // Send registration invitations (admin only)
    sendRegistrationInvitations = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { emails, message } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            throwValidationError('Emails array is required and must not be empty');
        }

        const result = await this.userService.sendRegistrationInvitations(emails, message);

        ResponseUtils.success(res, result, 'Registration invitations sent successfully');
    });

    // Send registration invitations from file upload (admin only)
    sendRegistrationInvitationsFromFile = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        if (!req.file) {
            throwValidationError('File is required');
        }

        const { message } = req.body;
        const result = await this.userService.sendRegistrationInvitationsFromFile(req.file!.buffer, message);

        ResponseUtils.success(res, result, 'Registration invitations sent from file successfully');
    });

    // Create user (admin only)
    createUser = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userData = req.body;
        const requestingUserRole = req.user?.role;

        const newUser = await this.userService.createUser(userData, requestingUserRole);

        ResponseUtils.created(res, newUser.user, 'User created successfully');
    });

    bulkDisableUsersWithFilters = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { collegeId, branchId, branchIds, collegeYear, collegeYears } = req.body;

        const filters: {
            collegeId?: string;
            branchId?: string;
            branchIds?: string[];
            collegeYear?: number;
            collegeYears?: number[]
        } = {};

        if (collegeId && collegeId.trim() !== '') {
            filters.collegeId = collegeId.trim();
        }
        if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
            filters.branchIds = branchIds.filter(id => id && id.trim() !== '').map(id => id.trim());
        } else if (branchId && branchId.trim() !== '') {
            filters.branchId = branchId.trim();
        }
        if (collegeYears && Array.isArray(collegeYears) && collegeYears.length > 0) {
            filters.collegeYears = collegeYears
                .map(y => typeof y === 'string' ? parseInt(y) : y)
                .filter(y => !isNaN(y) && y >= 1 && y <= 4);
        } else if (collegeYear !== undefined && collegeYear !== null && collegeYear !== '') {
            const year = typeof collegeYear === 'string' ? parseInt(collegeYear) : collegeYear;
            if (!isNaN(year)) {
                filters.collegeYear = year;
            }
        }

        const result = await this.userService.bulkDisableUsersWithFilters(filters);

        ResponseUtils.success(res, result, `Successfully disabled ${result.disabledCount} user(s)`);
    });

    bulkEnableUsersWithFilters = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { collegeId, branchId, branchIds, collegeYear, collegeYears } = req.body;

        const filters: {
            collegeId?: string;
            branchId?: string;
            branchIds?: string[];
            collegeYear?: number;
            collegeYears?: number[]
        } = {};

        if (collegeId && collegeId.trim() !== '') {
            filters.collegeId = collegeId.trim();
        }
        if (branchIds && Array.isArray(branchIds) && branchIds.length > 0) {
            filters.branchIds = branchIds.filter(id => id && id.trim() !== '').map(id => id.trim());
        } else if (branchId && branchId.trim() !== '') {
            filters.branchId = branchId.trim();
        }
        if (collegeYears && Array.isArray(collegeYears) && collegeYears.length > 0) {
            filters.collegeYears = collegeYears
                .map(y => typeof y === 'string' ? parseInt(y) : y)
                .filter(y => !isNaN(y) && y >= 1 && y <= 4);
        } else if (collegeYear !== undefined && collegeYear !== null && collegeYear !== '') {
            const year = typeof collegeYear === 'string' ? parseInt(collegeYear) : collegeYear;
            if (!isNaN(year)) {
                filters.collegeYear = year;
            }
        }

        const result = await this.userService.bulkEnableUsersWithFilters(filters);

        ResponseUtils.success(res, result, `Successfully enabled ${result.enabledCount} user(s)`);
    });

}




