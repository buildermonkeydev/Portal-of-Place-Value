import { UserRepository } from '../repository/UserRepository';
import { CollegeService } from '../../college/services/CollegeService';
import { BranchService } from '../../college/services/BranchService';
import { IUser, IUserDocument, UserRole } from '../../../core/types';
import { CreateUserDto, UpdateUserDto, LoginDto, ChangePasswordDto } from '../dto/user.dto';
import { User } from '../models/User';
import mongoose, { ClientSession } from 'mongoose';
import {
    throwDuplicateEmailError,
    throwInvalidCredentialsError,
    throwValidationError,
    throwUserNotFoundError,
    throwAuthorizationError,
    throwDatabaseError,
    withErrorHandling,
    throwNotFoundError
} from '../../../utils/errorUtils';
import { AppError, ERROR_CODES } from '../../../utils/errors';
import EmailService from '../../../core/services/EmailService';
import { AssessmentRepository } from '../../assessment/repository/AssessmentRepository';
import { AssessmentResultRepository } from '../../assessment/repository/AssessmentResultRepository';
import { TestRepository } from '../../test/repository/TestRepository';
import { userCachedService } from '../../../cached/user.cached.service';
import SecretUtils from '../../../utils/secretUtils';
import { logger } from '../../../utils/logger';

export class UserService {
    private userRepository = new UserRepository();
    private emailService: EmailService | null = null;
    private collegeService = new CollegeService();
    private branchService = new BranchService();
    /**
     * Flag to enable MongoDB transaction usage.
     * When true, deleteUserAndData will attempt to use transactions.
     * When false (default), operations will be performed without transactions.
     * This flag can be set via constructor parameter or MONGODB_ENABLE_TRANSACTIONS environment variable.
     * Transaction support is controlled by configuration rather than auto-detection to avoid
     * depending on fragile MongoDB driver internals.
     */
    private readonly enableTransactions: boolean;

    /**
     * Constructor for UserService
     * @param enableTransactions - Optional flag to enable MongoDB transactions. 
     *                              Defaults to false. If not provided, reads from MONGODB_ENABLE_TRANSACTIONS env var.
     */
    constructor(enableTransactions?: boolean) {
        // Read from environment variable if not explicitly provided
        if (enableTransactions === undefined) {
            const envValue = process.env.MONGODB_ENABLE_TRANSACTIONS;
            this.enableTransactions = envValue?.toLowerCase() === 'true' || envValue === '1';
        } else {
            this.enableTransactions = enableTransactions;
        }
    }

    /**
     * Lazy getter for email service to avoid Redis dependency during instantiation
     */
    private getEmailService(): EmailService {
        if (!this.emailService) {
            this.emailService = new EmailService();
        }
        return this.emailService;
    }

    private async _transformCollegeData(updateData: any): Promise<any> {
        const transformedData = { ...updateData };

        // Handle college updates by ID
        if (updateData.collegeId) {
            const college = await this.collegeService.findById(updateData.collegeId);
            if (!college) {
                throwValidationError(`College with ID '${updateData.collegeId}' not found`);
            }

            transformedData.college = {
                _id: String(college!._id),
                name: college!.name
            };
            delete transformedData.collegeId;

            // Handle branch updates within the college scope if possible
            if (updateData.branchId) {
                const branch = await this.branchService.findById(updateData.branchId);
                if (branch) {
                    transformedData.branch = {
                        _id: String(branch._id),
                        name: branch.name
                    };
                }
                delete transformedData.branchId;
            } else if (updateData.branchName) {
                // Find branch by name within selected college if possible, or just look it up
                const branch = await this.branchService.findByName(updateData.branchName);
                if (branch) {
                    transformedData.branch = {
                        _id: String(branch._id),
                        name: branch.name
                    };
                }
                delete transformedData.branchName;
            }
        } else if (updateData.collegeName) {
            // Handle college updates by name
            const college = await this.userRepository.findCollegeByName(updateData.collegeName);
            if (college) {
                transformedData.college = {
                    _id: String(college._id),
                    name: college.name
                };

                if (updateData.branchName) {
                    // Try to find if the branch name exists in the found college
                    const branch = college.branches?.find((b: any) => b.name === updateData.branchName);
                    if (branch) {
                        transformedData.branch = {
                            _id: String(branch._id),
                            name: branch.name
                        };
                    }
                }
            }
            delete transformedData.collegeName;
            delete transformedData.branchName;
        }

        return transformedData;
    }

    async getUsersByIds(userIds: string[]): Promise<IUserDocument[]> {
        if (!userIds || userIds.length === 0) {
            return [];
        }

        try {
            const uniqueIds = Array.from(new Set(userIds.map(id => id.toString())));
            return await this.userRepository.findByIds(uniqueIds);
        } catch (error) {
            logger.error('Get users by IDs failed:', error);
            throw error;
        }
    }

    /**
     * Create a new user
     * Only existing admins can create users with admin role
     */
    createUser = withErrorHandling(async (userData: CreateUserDto, requestingUserRole?: UserRole): Promise<{ user: IUserDocument; verificationToken: string }> => {
        const normalizedRegistrationNo = userData.registrationNo?.trim().toUpperCase();
        const normalizedFirstName = userData.firstName?.trim().toUpperCase();
        const normalizedLastName = userData.lastName?.trim().toUpperCase();

        const isCreatingAdmin = userData.role === UserRole.ADMIN;


        // Security check: Only admins can create users with admin role
        if (isCreatingAdmin && requestingUserRole !== UserRole.ADMIN) {
            throwAuthorizationError('Only admins can create users with admin role');
        }

        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throwDuplicateEmailError(userData.email);
        }

        if (!isCreatingAdmin && userData.role === UserRole.STUDENT) {
            const existingRegistrationNo = await this.userRepository.findByRegistrationNo(normalizedRegistrationNo);
            if (existingRegistrationNo) {
                throwValidationError('Registration number already exists');
            }
        }

        let finalRegistrationNo = normalizedRegistrationNo;
        if (isCreatingAdmin && !finalRegistrationNo) {
            const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
            finalRegistrationNo = `ADMIN${randomSuffix}`;
        }

        const transformedUserData = await this._transformCollegeData({
            ...userData,
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            registrationNo: finalRegistrationNo,
            password: userData.password,
            isEmailVerified: false,
            role: userData.role || UserRole.STUDENT,
        });

        const user = await this.userRepository.create(transformedUserData);

        const { token: verificationToken } = await SecretUtils.generateEmailVerificationToken(
            user._id + "",
            user.email
        );

        // Queue verification email
        await this.getEmailService().sendRegistrationEmail(
            user.email,
            user.firstName + " " + user.lastName,
            this.getEmailService().generateVerificationUrl(verificationToken)
        );

        const userForCache = { ...user.toObject() };
        await userCachedService.setUser(user._id + "", userForCache);
        await userCachedService.setUserByEmail(user.email, userForCache);
        logger.debug(`New user cached: ${user.email}`);

        // Check for pending assessment invitations (async, don't block registration)
        setImmediate(async () => {
            try {
                await this.checkAndProcessPendingInvitations(user.email, (user._id as any).toString());
            } catch (error) {
                logger.warn(`Failed to check pending invitations for user ${user.email}:`, error);
            }
        });

        logger.info(`User created successfully: ${user.email}`);
        return { user, verificationToken };
    });

    /**
     * User login
     */
    login = withErrorHandling(async (loginData: LoginDto): Promise<{ user: IUserDocument; accessToken: string; refreshToken: string }> => {
        // Check user existence in cache first for quick validation
        console.log("LOginBody", loginData)
        const userExistsInCache = await userCachedService.getUserByEmail(loginData.email);

        const user = await this.userRepository.findByEmail(loginData.email);
        console.log("User found:", user ? "Yes" : "No");
console.log("User object keys:", user ? Object.keys(user) : "No user");
console.log("Has college field:", user && 'college' in user);
console.log("Has branch field:", user && 'branch' in user);
        if (!user) {
            throwInvalidCredentialsError();
        }

        if (!userExistsInCache) {
            const userForCache = { ...user!.toObject() };
            delete userForCache.password;
            await userCachedService.setUserByEmail(loginData.email, userForCache);
            logger.debug(`User cached by email: ${loginData.email}`);
        } else {
            logger.debug(`User cache hit by email: ${loginData.email}`);
        }

        console.log("UserFOUNd", user);
        const userDoc = user!;

        // Check if email is verified
        if (!userDoc.isEmailVerified) {
            throwValidationError('Please verify your email before logging in');
        }

        // Check if user is active
        if (!userDoc.isActive) {
            throwValidationError('Your account has been deactivated. Please contact support.');
        }

        // Verify password
        // console.log("Input password:", loginData.password);
        // console.log("Stored hash:", userDoc.password);
        // console.log("Password length:", loginData.password.length);
        // console.log("Hash length:", userDoc.password.length);

        const isPasswordValid = await SecretUtils.comparePassword(loginData.password, userDoc.password);
        console.log("isPasswordValid", isPasswordValid)
        if (!isPasswordValid) {
            throwInvalidCredentialsError();
        }

        // Generate tokens
        const accessToken = SecretUtils.generateAccessToken({
            userId: userDoc._id + "",
            email: userDoc.email,
            role: userDoc.role,
        });

        const { token: refreshToken } = await SecretUtils.generateRefreshToken(userDoc._id + "");

        // Update last login
        await this.userRepository.updateLastLogin(userDoc._id + "");

        // Cache user session
        const sessionData = {
            userId: userDoc._id + "",
            email: userDoc.email,
            role: userDoc.role,
            lastLogin: new Date().toISOString(),
            accessToken,
            refreshToken
        };
        await userCachedService.setUserSession(userDoc._id + "", sessionData);
        await userCachedService.setUser(userDoc._id + "", userDoc);

        logger.info(`User logged in successfully: ${userDoc.email}`);
        return { user: userDoc, accessToken, refreshToken };
    });

    verifyEmail = withErrorHandling(async (token: string): Promise<{ user: IUserDocument; message: string }> => {
    // Verify token
    const decoded = SecretUtils.verifyToken(token) as any;
    console.log("Verify mail is called 1")
    
    if (decoded.type !== 'email_verification') {
        throwValidationError('Invalid verification token');
    }
    console.log("Verify mail is called 2")
    
    // Find user
    const user = await this.userRepository.findById(decoded.userId);
    console.log("Verify mail is called 3")
    
    if (!user) {
        throwUserNotFoundError(decoded.userId);
    }
    console.log("Verify mail is called 4")
    
    const userDoc = user!;
    console.log("Verify mail is called 5")
    console.log("User object structure:", Object.keys(userDoc))
    console.log("isEmailVerified value:", userDoc.isEmailVerified)
    console.log("isEmailVerified type:", typeof userDoc.isEmailVerified)
    
    // Check if already verified with safe access
    let isVerified = false;
    try {
        isVerified = userDoc.isEmailVerified === true;
        console.log("isVerified after safe check:", isVerified)
    } catch (err) {
        console.error("Error accessing isEmailVerified:", err)
        throw new Error(`User document missing isEmailVerified field: ${err}`);
    }
    
    if (isVerified) {
        console.log("User is already verified, returning early")
        return { user: userDoc, message: 'Email already verified' };
    }
    
    console.log("Verify mail is called 6 - User not verified, proceeding...")
    
    // Update user
    const updatedUser = await this.userRepository.update(userDoc._id + "", {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
    });
    console.log("Verify mail is called 7")
    
    if (!updatedUser) {
        throwDatabaseError('Failed to update user email verification status');
    }
    console.log("Verify mail is called 8")
    
    // Queue welcome email
    try {
        console.log("Getting email service...");
        const emailService = this.getEmailService();
        console.log("Email service obtained:", !!emailService);
        
        console.log("About to send welcome email to:", userDoc.email);
        await emailService.sendWelcomeEmail(
            userDoc.email,
            userDoc.firstName + " " + userDoc.lastName
        );
        console.log("Welcome mail is called - SUCCESS");
        logger.info(`Welcome email sent successfully to: ${userDoc.email}`);
    } catch (emailError) {
        console.error("ERROR in welcome email:", emailError);
        logger.error(`Failed to send welcome email to ${userDoc.email}:`, {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            stack: emailError instanceof Error ? emailError.stack : undefined
        });
    }

    logger.info(`Email verified successfully: ${userDoc.email}`);
    return { user: updatedUser!, message: 'Email verified successfully' };
});

    /**
     * Forgot password
     */
    async forgotPassword(email: string): Promise<{ message: string }> {
        try {
            // Find user
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                // Don't reveal if user exists or not for security
                return { message: 'If an account with this email exists, a password reset link has been sent' };
            }

            // Generate reset token
            const { token: resetToken } = await SecretUtils.generatePasswordResetToken(user._id + "");

            console.log("RESET_TOKEN", resetToken)
            // Queue reset email
            await this.getEmailService().sendForgotPasswordEmail(
                user.email,
                user.firstName + " " + user.lastName,
                this.getEmailService().generatePasswordResetUrl(resetToken)
            );

            logger.info(`Password reset email sent to: ${email}`);
            return { message: 'If an account with this email exists, a password reset link has been sent' };
        } catch (error) {
            logger.error('Forgot password failed', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Reset password
     */
    async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        try {
            // Verify token
            const decoded = SecretUtils.verifyToken(token) as any;

            if (decoded.type !== 'password_reset') {
                throw new Error('Invalid reset token');
            }

            // Find user
            const user = await this.userRepository.findById(decoded.userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Hash new password
            const hashedPassword = await SecretUtils.hashPassword(newPassword);

            // Update user
            await this.userRepository.update(user._id + "", {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            });

            logger.info(`Password reset successfully: ${user.email}`);
            return { message: 'Password reset successfully' };
        } catch (error) {
            logger.error('Password reset failed', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Change password
     */
    async changePassword(userId: string, changePasswordData: ChangePasswordDto): Promise<{ message: string }> {
        try {
            // Find user
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isCurrentPasswordValid = await SecretUtils.comparePassword(
                changePasswordData.currentPassword,
                user.password
            );
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const hashedPassword = await SecretUtils.hashPassword(changePasswordData.newPassword);

            // Update user
            await this.userRepository.update(userId, {
                password: hashedPassword,
                passwordChangedAt: new Date(),
            });

            logger.info(`Password changed successfully: ${user.email}`);
            return { message: 'Password changed successfully' };
        } catch (error) {
            logger.error('Password change failed', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updateData: UpdateUserDto): Promise<IUserDocument> {
        try {
            console.log('UserService.updateProfile - User ID:', userId);
            console.log('UserService.updateProfile - Update Data:', updateData);

            // Handle college updates if provided
            const transformedUpdateData = await this._transformCollegeData(updateData);

            console.log('UserService.updateProfile - Final transformed data:', transformedUpdateData);
            console.log('UserService.updateProfile - Calling userRepository.update...');

            const updatedUser = await this.userRepository.update(userId, transformedUpdateData);
            logger.info(`Profile updated successfully: ${updatedUser?.email}`);
            console.log('UserService.updateProfile - Update result:', updatedUser);

            // Invalidate cache for updated user
            if (updatedUser) {
                // Invalidate all user-related caches
                await userCachedService.invalidateUserCache(userId);
                await userCachedService.invalidateUserCacheByEmail(updatedUser.email);

                // If registration number changed, invalidate that cache too
                if (updateData.registrationNo) {
                    await userCachedService.invalidateUserCacheByRegistration(updateData.registrationNo);
                }

                // Invalidate user list caches since user data changed
                await userCachedService.invalidateUserListCaches();

                // Refresh cache with updated data
                const userForCache = { ...updatedUser.toObject() };
                delete userForCache.password;
                await userCachedService.setUser(userId, userForCache);
                await userCachedService.setUserByEmail(updatedUser.email, userForCache);

                logger.info(`All user caches invalidated and refreshed for user: ${userId}`);
            }

            return updatedUser!;
        } catch (error) {
            logger.error('Profile update failed:', error);
            throw error;
        }
    }

    /**
     * Check for pending assessment invitations and add user to assigned users
     */
    async checkAndProcessPendingInvitations(userEmail: string, userId: string): Promise<void> {
        try {
            // Import AssessmentRepository here to avoid circular dependency
            const assessmentRepository = new AssessmentRepository();

            // Find assessments where this user's email is in invitedUsers
            const pendingAssessments = await assessmentRepository.findByInvitedUser(userEmail);

            if (pendingAssessments.length > 0) {
                logger.info(`Found ${pendingAssessments.length} pending assessment invitations for user ${userEmail}`);

                // Process each assessment
                for (const assessment of pendingAssessments) {
                    try {
                        // Add user to assignedUsers if not already there
                        if (!assessment.assignedUsers.includes(userId)) {
                            const updatedAssignedUsers = [...assessment.assignedUsers, userId];

                            // Remove email from invitedUsers since user is now registered
                            const updatedInvitedUsers = (assessment.invitedUsers || []).filter(email => email !== userEmail);

                            await assessmentRepository.update((assessment._id as any).toString(), {
                                assignedUsers: updatedAssignedUsers,
                                invitedUsers: updatedInvitedUsers
                            });

                            logger.info(`Added user ${userId} to assessment ${assessment._id} and removed from invitedUsers`);
                        }
                    } catch (error) {
                        logger.error(`Failed to process assessment ${assessment._id} for user ${userId}:`, error);
                        // Continue with other assessments even if one fails
                    }
                }
            }
        } catch (error) {
            logger.error(`Error checking pending invitations for user ${userEmail}:`, error);
            // Don't fail user registration if invitation processing fails
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string): Promise<IUserDocument | null> {
        try {
            return await this.userRepository.findByEmail(email);
        } catch (error) {
            logger.error(`Error getting user by email ${email}:`, error);
            return null;
        }
    }

    /**
     * Get user by ID with caching
     */
    async getUserById(userId: string, forceRefresh: boolean = false): Promise<IUserDocument> {
        try {
            let user: IUserDocument | null = null;

            // If force refresh is requested, skip cache and go directly to database
            if (!forceRefresh) {
                // Try to get from cache first
                user = await userCachedService.getUser(userId);
            }

            if (!user) {
                // Cache miss or force refresh - get from database
                user = await this.userRepository.findById(userId);
                if (!user) {
                    throw new Error('User not found');
                }

                // Cache the fresh data
                const userForCache = { ...user.toObject() };
                delete userForCache.password;
                await userCachedService.setUser(userId, userForCache);
                await userCachedService.setUserByEmail(user.email, userForCache);

                logger.debug(`User data refreshed from database for user: ${userId}`);
            }

            return user;
        } catch (error) {
            logger.error('Get user by ID failed:', error);
            throw error;
        }
    }

    /**
     * Get all users (admin only)
     */
    async getAllUsers(page: number = 1, limit: number = 20, search?: string): Promise<{
        users: IUser[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {

            const result = await this.userRepository.findManyWithPagination({}, { page, limit, search: search || "" });

            // Convert IUserDocument[] to IUser[] by mapping the _id field
            const users: IUser[] = result.users.map(userDoc => ({
                ...userDoc.toObject(),
                _id: String(userDoc._id)
            }));

            return {
                users,
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            };
        } catch (error) {
            logger.error('Get all users failed:', error);
            throw error;
        }
    }

    /**
     * Get all users with filter (admin only) - without search functionality
     */
    async getAllUsersWithFilter(page: number = 1, limit: number = 20, filter: any = {}): Promise<{
        users: IUser[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const result = await this.userRepository.findManyWithPagination(filter, { page, limit });

            // Convert IUserDocument[] to IUser[] by mapping the _id field
            const users: IUser[] = result.users.map(userDoc => ({
                ...userDoc.toObject(),
                _id: String(userDoc._id)
            }));

            return {
                users,
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            };
        } catch (error) {
            logger.error('Get all users with filter failed:', error);
            throw error;
        }
    }

    /**
     * Update user (admin only)
     * Only existing admins can update users to have admin role
     */
    async updateUser(userId: string, updateData: Partial<IUser>, requestingUserRole?: UserRole): Promise<IUserDocument> {
        try {
            // Security check: Only admins can update users to admin role
            if (updateData.role === UserRole.ADMIN && requestingUserRole !== UserRole.ADMIN) {
                throwAuthorizationError('Only admins can update users to admin role');
            }

            const normalizedUpdate: Partial<IUser> = { ...updateData };

            if (updateData.firstName) {
                normalizedUpdate.firstName = updateData.firstName.trim().toUpperCase();
            }

            if (updateData.lastName) {
                normalizedUpdate.lastName = updateData.lastName.trim().toUpperCase();
            }

            if (updateData.registrationNo) {
                normalizedUpdate.registrationNo = updateData.registrationNo.trim().toUpperCase();
            }

            // Handle college/branch transformation
            const transformedUpdate = await this._transformCollegeData(normalizedUpdate);

            const updatedUser = await this.userRepository.update(userId, transformedUpdate);
            logger.info(`User updated by admin: ${updatedUser?.email}`);
            return updatedUser!;
        } catch (error) {
            logger.error('User update by admin failed:', error);
            throw error;
        }
    }

    /**
     * Delete user (admin only)
     */
    async deleteUser(userId: string): Promise<{ message: string }> {
        try {
            await this.userRepository.delete(userId);
            logger.info(`User deleted by admin: ${userId}`);
            return { message: 'User deleted successfully' };
        } catch (error) {
            logger.error('User deletion by admin failed:', error);
            throw error;
        }
    }

    /**
     * Soft delete user and associated data (admin only)
     */
    async deleteUserAndData(userId: string, performedBy?: string): Promise<{
        anonymizedEmail: string;
        removedAssessments: number;
        removedTests: number;
        softDeletedResults: number;
    }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throwUserNotFoundError(userId);
        }

        const existingUser = user as IUserDocument;

        const now = new Date();
        const anonymizedEmail = `deleted_${userId}_${now.getTime()}@deleted.blcompiler.com`;
        const anonymizedRegistration = `DELETED_${userId}_${now.getTime()}`;

        const softDeletePayload: Record<string, any> = {
            email: anonymizedEmail,
            firstName: 'Deleted',
            lastName: 'User',
            mobileNumber: '0000000000',
            registrationNo: anonymizedRegistration,
            isActive: false,
            isEmailVerified: false,
            isDeleted: true,
            deletedAt: now,
        };

        if (performedBy) {
            if (!mongoose.Types.ObjectId.isValid(performedBy)) {
                throwValidationError('Invalid performedBy user ID format');
            }
            softDeletePayload.deletedBy = new mongoose.Types.ObjectId(performedBy);
        }

        const assessmentRepository = new AssessmentRepository();
        const assessmentResultRepository = new AssessmentResultRepository();
        const testRepository = new TestRepository();

        const executeDeletion = async (session?: ClientSession) => {
            await this.userRepository.softDeleteUser(userId, softDeletePayload, session);

            const [removedAssessments, removedTests, softDeletedResults] = await Promise.all([
                assessmentRepository.removeUserFromAssignments(userId, session),
                testRepository.removeUserAssignments(userId, session),
                assessmentResultRepository.softDeleteByUser(userId, now, session),
            ]);

            return { removedAssessments, removedTests, softDeletedResults };
        };

        const session = await mongoose.startSession();
        let transactionStarted = false;
        let deletionSummary: { removedAssessments: number; removedTests: number; softDeletedResults: number } | null = null;

        // Transaction usage is controlled by the enableTransactions configuration flag.
        // If enabled, operations are performed within a transaction; otherwise, they run without one.
        // If a transaction fails due to unsupported deployment (e.g., standalone MongoDB),
        // the code falls back to non-transactional operations automatically.
        try {
            if (this.enableTransactions) {
                await session.startTransaction();
                transactionStarted = true;
                deletionSummary = await executeDeletion(session);
                await session.commitTransaction();
            } else {
                deletionSummary = await executeDeletion();
            }
        } catch (error) {
            if (transactionStarted && session.inTransaction()) {
                await session.abortTransaction().catch(() => undefined);
            }

            if (this.isTransactionNotSupported(error)) {
                logger.warn('MongoDB deployment does not support transactions; retrying deleteUserAndData without transaction', {
                    userId,
                    error: error instanceof Error ? error.message : String(error),
                });

                try {
                    deletionSummary = await executeDeletion();
                } catch (fallbackError) {
                    throw this.buildDeletionError(fallbackError, userId);
                }
            } else {
                throw this.buildDeletionError(error, userId);
            }
        } finally {
            session.endSession();
        }

        if (!deletionSummary) {
            throw this.buildDeletionError(new Error('User deletion summary unavailable'), userId);
        }

        await this.invalidateUserCachesAfterDeletion(existingUser);

        logger.info('User data soft deleted by admin', {
            userId,
            performedBy,
            removedAssessments: deletionSummary.removedAssessments,
            removedTests: deletionSummary.removedTests,
            softDeletedResults: deletionSummary.softDeletedResults,
            anonymizedEmail,
        });

        return {
            anonymizedEmail,
            removedAssessments: deletionSummary.removedAssessments,
            removedTests: deletionSummary.removedTests,
            softDeletedResults: deletionSummary.softDeletedResults,
        };
    }

    /**
     * Toggle user status (admin only)
     */
    async toggleUserStatus(userId: string): Promise<IUserDocument> {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const updatedUser = await this.userRepository.update(userId, {
                isActive: !user.isActive,
            });

            logger.info(`User status toggled: ${updatedUser?.email} - ${updatedUser?.isActive ? 'Active' : 'Inactive'}`);
            return updatedUser!;
        } catch (error) {
            logger.error('User status toggle failed:', error);
            throw error;
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            // Verify refresh token
            const decoded = SecretUtils.verifyRefreshToken(refreshToken);

            // Find user
            const user = await this.userRepository.findById(decoded.userId);
            if (!user || !user.isActive) {
                throw new Error('Invalid refresh token');
            }

            // Generate new access token
            const accessToken = SecretUtils.generateAccessToken({
                userId: user._id + "",
                email: user.email,
                role: user.role,
            });

            logger.info(`Access token refreshed: ${user.email}`);
            return { accessToken };
        } catch (error) {
            logger.error('Token refresh failed:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout(userId: string): Promise<{ message: string }> {
        try {
            // In a real application, you might want to blacklist the refresh token
            // For now, we'll just log the logout
            logger.info(`User logged out: ${userId}`);
            return { message: 'Logged out successfully' };
        } catch (error) {
            logger.error('Logout failed:', error);
            throw error;
        }
    }

    /**
     * Update user role (admin only)
     * Only existing admins can promote users to admin role
     */
    async updateUserRole(userId: string, role: UserRole, requestingUserRole?: UserRole): Promise<IUserDocument> {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Security check: Only admins can promote users to admin role
            if (role === UserRole.ADMIN && requestingUserRole !== UserRole.ADMIN) {
                throwAuthorizationError('Only admins can promote users to admin role');
            }

            const updatedUser = await this.userRepository.update(userId, { role });
            logger.info(`User role updated: ${updatedUser?.email} - ${role}`);
            return updatedUser!;
        } catch (error) {
            logger.error('User role update failed:', error);
            throw error;
        }
    }

    /**
     * Get user assessments (admin only)
     */
    async getUserAssessments(userId: string): Promise<any[]> {
        try {
            // This would typically involve joining with Assessment and AssessmentResult collections
            // For now, returning empty array - implementation depends on your assessment structure
            logger.info(`Getting assessments for user: ${userId}`);
            return [];
        } catch (error) {
            logger.error('Get user assessments failed:', error);
            throw error;
        }
    }

    /**
     * Get user results (admin only)
     */
    async getUserResults(userId: string): Promise<any[]> {
        try {
            // This would typically involve joining with AssessmentResult collection
            // For now, returning empty array - implementation depends on your result structure
            logger.info(`Getting results for user: ${userId}`);
            return [];
        } catch (error) {
            logger.error('Get user results failed:', error);
            throw error;
        }
    }

    /**
 * Bulk delete users (admin only)
 */
    async bulkDeleteUsers(userIds: string[]): Promise<{ deletedCount: number; failedIds: string[] }> {
        try {
            return await this.userRepository.bulkDelete(userIds);
        } catch (error) {
            logger.error('Bulk delete users failed:', error);
            throw error;
        }
    }

    /**
     * Bulk update user roles (admin only)
     * Only existing admins can promote users to admin role
     */
    async bulkUpdateUserRoles(userIds: string[], role: UserRole, requestingUserRole?: UserRole): Promise<{ updatedCount: number; failedIds: string[] }> {
        try {
            // Security check: Only admins can promote users to admin role
            if (role === UserRole.ADMIN && requestingUserRole !== UserRole.ADMIN) {
                throwAuthorizationError('Only admins can promote users to admin role');
            }

            const results = await Promise.allSettled(
                userIds.map(id => this.userRepository.update(id, { role }))
            );

            const updatedCount = results.filter(result =>
                result.status === 'fulfilled' && (result as PromiseFulfilledResult<IUserDocument | null>).value !== null
            ).length;

            const failedIds = userIds.filter((_, index) => {
                const result = results[index];
                if (!result) return false;
                return result.status === 'rejected' ||
                    (result.status === 'fulfilled' && (result as PromiseFulfilledResult<IUserDocument | null>).value === null);
            });

            logger.info(`Bulk role update completed: ${updatedCount} updated, ${failedIds.length} failed`);
            return { updatedCount, failedIds };
        } catch (error) {
            logger.error('Bulk role update failed:', error);
            throw error;
        }
    }

    /**
     * Bulk assign assessment (admin only)
     */
    async bulkAssignAssessment(userIds: string[], assessmentId: string): Promise<{ assignedCount: number; failedIds: string[] }> {
        try {
            // This would typically involve creating AssessmentResult records for each user
            // For now, returning mock data - implementation depends on your assessment structure
            logger.info(`Bulk assessment assignment: ${userIds.length} users, assessment: ${assessmentId}`);

            // Mock implementation - replace with actual logic
            const assignedCount = userIds.length;
            const failedIds: string[] = [];

            return { assignedCount, failedIds };
        } catch (error) {
            logger.error('Bulk assessment assignment failed:', error);
            throw error;
        }
    }

    /**
     * Export users (admin only)
     */
    async exportUsers(): Promise<{ users: any[]; total: number }> {
        try {
            const users = await this.userRepository.findMany({}, {
                select: '-password -emailVerificationToken -emailVerificationExpires -passwordResetToken -passwordResetExpires'
            });

            const exportData = users.map(user => ({
                id: String(user._id),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                isEmailVerified: user.isEmailVerified,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }));

            logger.info(`Users exported: ${exportData.length} total`);
            return { users: exportData, total: exportData.length };
        } catch (error) {
            logger.error('Export users failed:', error);
            throw error;
        }
    }

    /**
     * Import users (admin only)
     * Only existing admins can import users with admin role
     */
    async importUsers(users: any[], requestingUserRole?: UserRole): Promise<{ importedCount: number; failedCount: number; errors: any[] }> {
        try {
            // Security check: Only admins can import users with admin role
            const hasAdminUsers = users.some(user => user.role === UserRole.ADMIN);
            if (hasAdminUsers && requestingUserRole !== UserRole.ADMIN) {
                throwAuthorizationError('Only admins can import users with admin role');
            }

            const results = await Promise.allSettled(
                users.map(userData => this.createUser(userData, requestingUserRole))
            );

            const importedCount = results.filter(result =>
                result.status === 'fulfilled'
            ).length;

            const failedCount = results.filter(result =>
                result.status === 'rejected'
            ).length;

            const errors = results
                .map((result, index) =>
                    result.status === 'rejected' ? { index, error: result.reason } : null
                )
                .filter(Boolean);

            logger.info(`Users import completed: ${importedCount} imported, ${failedCount} failed`);
            return { importedCount, failedCount, errors };
        } catch (error) {
            logger.error('Import users failed:', error);
            throw error;
        }
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail(email: string): Promise<boolean> {
        try {
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                return false;
            }

            if (user.isEmailVerified) {
                return false;
            }

            // Generate new verification token
            const { token: verificationToken } = await SecretUtils.generateEmailVerificationToken(
                user._id + "",
                user.email
            );

            // Queue verification email
            await this.getEmailService().sendRegistrationEmail(
                user.email,
                user.firstName + " " + user.lastName,
                this.getEmailService().generateVerificationUrl(verificationToken)
            );

            logger.info(`Verification email resent to: ${email}`);
            return true;
        } catch (error) {
            logger.error('Resend verification email failed:', error);
            return false;
        }
    }

    /**
     * Send registration invitations to users (admin only)
     */
    sendRegistrationInvitations = withErrorHandling(async (emails: string[], message?: string): Promise<{ success: string[]; failed: string[] }> => {
        const success: string[] = [];
        const failed: string[] = [];

        for (const email of emails) {
            try {
                // Check if user already exists
                const existingUser = await this.userRepository.findByEmail(email);
                if (existingUser) {
                    failed.push(`${email} - User already exists`);
                    continue;
                }

                // Send invitation email
                const registrationUrl = this.getEmailService().generateRegistrationUrl();
                const result = await this.getEmailService().sendRegistrationInvitation(email, {
                    name: email, // Using email as name since we don't have the actual name
                    registrationUrl,
                    customMessage: message
                });

                if (result) {
                    success.push(email);
                } else {
                    failed.push(email);
                }
            } catch (error) {
                logger.error(`Failed to send invitation to ${email}:`, error);
                failed.push(email);
            }
        }

        return { success, failed };
    });

    /**
     * Send registration invitations from file upload (admin only)
     */
    sendRegistrationInvitationsFromFile = withErrorHandling(async (fileBuffer: Buffer, message?: string): Promise<{ success: string[]; failed: string[] }> => {
        try {
            // Parse the text file content
            const fileContent = fileBuffer.toString('utf-8');
            const emails = fileContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && line.includes('@'))
                .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

            if (emails.length === 0) {
                throw new Error('No valid emails found in the uploaded file');
            }

            // Send invitations to all emails
            return await this.sendRegistrationInvitations(emails, message);
        } catch (error) {
            logger.error('Error processing file upload:', error);
            throw error;
        }
    });

    /**
     * Bulk disable users based on filters (admin only)
     */
    async bulkDisableUsersWithFilters(filters: {
        collegeId?: string;
        branchId?: string;
        branchIds?: string[];
        collegeYear?: number;
        collegeYears?: number[];
    }): Promise<{ disabledCount: number; matchedCount: number; filter: any }> {
        try {
            // Build filter query
            const queryFilter: any = {};

            if (filters.collegeId) {
                // Handle both ObjectId and string formats for college._id
                const collegeObjectId = mongoose.Types.ObjectId.isValid(filters.collegeId)
                    ? new mongoose.Types.ObjectId(filters.collegeId)
                    : filters.collegeId;
                queryFilter['college._id'] = collegeObjectId;
            }

            // Support both single branchId and multiple branchIds
            if (filters.branchIds && filters.branchIds.length > 0) {
                // Get branch names as fallback if IDs don't match
                const branchIds = filters.branchIds.map(id =>
                    mongoose.Types.ObjectId.isValid(id)
                        ? new mongoose.Types.ObjectId(id)
                        : id
                );

                // Fetch branches to get their names
                const branches = await Promise.all(
                    branchIds.map(async (id) => {
                        const branch = await this.branchService.findById(id.toString());
                        return branch;
                    })
                );

                const validBranches = branches.filter(b => b !== null);
                const branchNames = validBranches.map(b => b!.name);

                // Match by branch._id OR branch.name (if IDs don't match, try names)
                if (branchNames.length > 0) {
                    queryFilter.$or = [
                        { 'branch._id': { $in: branchIds } },
                        { 'branch.name': { $in: branchNames } }
                    ];
                } else {
                    // Fallback to ID only if no valid branches found
                    queryFilter['branch._id'] = { $in: branchIds };
                }
            } else if (filters.branchId) {
                const branchObjectId = mongoose.Types.ObjectId.isValid(filters.branchId)
                    ? new mongoose.Types.ObjectId(filters.branchId)
                    : filters.branchId;

                // Try to get branch by ID to get name
                const branch = await this.branchService.findById(filters.branchId);

                if (branch) {
                    // Match by branch._id OR branch.name
                    queryFilter.$or = [
                        { 'branch._id': branchObjectId },
                        { 'branch.name': branch.name }
                    ];
                } else {
                    // Fallback to ID only if branch not found
                    queryFilter['branch._id'] = branchObjectId;
                }
            }

            // Support both single collegeYear and multiple collegeYears
            // Only apply year filter if explicitly provided
            if (filters.collegeYears && filters.collegeYears.length > 0) {
                queryFilter.collegeYear = { $in: filters.collegeYears };
            } else if (filters.collegeYear !== undefined && filters.collegeYear !== null) {
                queryFilter.collegeYear = filters.collegeYear;
            }


            if (!filters.collegeId && !filters.branchId && !filters.branchIds &&
                filters.collegeYear === undefined && filters.collegeYears === undefined) {
                throwValidationError('At least one filter must be provided (college, branch, or year)');
            }

            // Don't disable admins - add filter to exclude admins
            queryFilter.role = { $ne: UserRole.ADMIN };

            // Update users matching the filter (including already disabled ones to ensure consistency)
            // Using upsert: false to avoid creating new documents
            const result = await User.updateMany(
                queryFilter,
                { $set: { isActive: false } }
            );

            logger.info(`Bulk disable completed: ${result.matchedCount} users matched, ${result.modifiedCount} users actually modified (some may have been already disabled) with filters:`, filters);
            logger.debug('Query filter used:', JSON.stringify(queryFilter, null, 2));

            return {
                disabledCount: result.modifiedCount,
                matchedCount: result.matchedCount,
                filter: queryFilter
            };
        } catch (error) {
            logger.error('Bulk disable users with filters failed:', error);
            throw error;
        }
    }

    /**
     * Bulk enable users based on filters (admin only)
     */
    async bulkEnableUsersWithFilters(filters: {
        collegeId?: string;
        branchId?: string;
        branchIds?: string[];
        collegeYear?: number;
        collegeYears?: number[];
    }): Promise<{ enabledCount: number; matchedCount: number; filter: any }> {
        try {
            // Build filter query
            const queryFilter: any = {};

            if (filters.collegeId) {
                // Handle both ObjectId and string formats for college._id
                const collegeObjectId = mongoose.Types.ObjectId.isValid(filters.collegeId)
                    ? new mongoose.Types.ObjectId(filters.collegeId)
                    : filters.collegeId;
                queryFilter['college._id'] = collegeObjectId;
            }

            // Support both single branchId and multiple branchIds
            if (filters.branchIds && filters.branchIds.length > 0) {
                // Get branch names as fallback if IDs don't match
                const branchIds = filters.branchIds.map(id =>
                    mongoose.Types.ObjectId.isValid(id)
                        ? new mongoose.Types.ObjectId(id)
                        : id
                );

                // Fetch branches to get their names
                const branches = await Promise.all(
                    branchIds.map(async (id) => {
                        const branch = await this.branchService.findById(id.toString());
                        return branch;
                    })
                );

                const validBranches = branches.filter(b => b !== null);
                const branchNames = validBranches.map(b => b!.name);

                // Match by branch._id OR branch.name (if IDs don't match, try names)
                if (branchNames.length > 0) {
                    queryFilter.$or = [
                        { 'branch._id': { $in: branchIds } },
                        { 'branch.name': { $in: branchNames } }
                    ];
                } else {
                    // Fallback to ID only if no valid branches found
                    queryFilter['branch._id'] = { $in: branchIds };
                }
            } else if (filters.branchId) {
                const branchObjectId = mongoose.Types.ObjectId.isValid(filters.branchId)
                    ? new mongoose.Types.ObjectId(filters.branchId)
                    : filters.branchId;

                // Try to get branch by ID to get name
                const branch = await this.branchService.findById(filters.branchId);

                if (branch) {
                    // Match by branch._id OR branch.name
                    queryFilter.$or = [
                        { 'branch._id': branchObjectId },
                        { 'branch.name': branch.name }
                    ];
                } else {
                    // Fallback to ID only if branch not found
                    queryFilter['branch._id'] = branchObjectId;
                }
            }

            // Support both single collegeYear and multiple collegeYears
            // Only apply year filter if explicitly provided
            if (filters.collegeYears && filters.collegeYears.length > 0) {
                queryFilter.collegeYear = { $in: filters.collegeYears };
            } else if (filters.collegeYear !== undefined && filters.collegeYear !== null) {
                queryFilter.collegeYear = filters.collegeYear;
            }

            // Ensure at least one filter is provided
            // Valid combinations: college, college+branch, college+year, college+branch+year, or just year
            if (!filters.collegeId && !filters.branchId && !filters.branchIds &&
                filters.collegeYear === undefined && filters.collegeYears === undefined) {
                throwValidationError('At least one filter must be provided (college, branch, or year)');
            }

            // Don't enable admins - add filter to exclude admins (though this is optional)
            queryFilter.role = { $ne: UserRole.ADMIN };

            // Update users matching the filter
            const result = await User.updateMany(
                queryFilter,
                { $set: { isActive: true } }
            );

            logger.info(`Bulk enable completed: ${result.matchedCount} users matched, ${result.modifiedCount} users actually modified (some may have been already enabled) with filters:`, filters);
            logger.debug('Query filter used:', JSON.stringify(queryFilter, null, 2));

            return {
                enabledCount: result.modifiedCount,
                matchedCount: result.matchedCount,
                filter: queryFilter
            };
        } catch (error) {
            logger.error('Bulk enable users with filters failed:', error);
            throw error;
        }
    }

    private isTransactionNotSupported(error: unknown): boolean {
        if (!error) {
            return false;
        }

        const mongoError = error as { code?: number; message?: string };

        if (mongoError.code === 20) {
            return true;
        }

        const message = mongoError.message ?? '';
        return message.includes('Transaction numbers are only allowed on a replica set member or mongos');
    }

    private async invalidateUserCachesAfterDeletion(user: IUserDocument): Promise<void> {
        const userIdString = String(user._id);

        const tasks: Promise<void>[] = [
            userCachedService.invalidateUserCache(userIdString),
            userCachedService.invalidateUserListCaches(),
        ];

        if (user.email) {
            tasks.push(userCachedService.invalidateUserCacheByEmail(user.email));
        }

        if (user.registrationNo) {
            tasks.push(userCachedService.invalidateUserCacheByRegistration(user.registrationNo));
        }

        await Promise.all(tasks);
    }

    private buildDeletionError(error: unknown, userId: string): never {
        logger.error('User soft deletion failed', {
            userId,
            error: error instanceof Error ? error.message : String(error),
        });

        throw new AppError(
            'Unable to delete this user right now. Please try again later.',
            500,
            ERROR_CODES.DATABASE_ERROR,
            true
        );
    }
}
