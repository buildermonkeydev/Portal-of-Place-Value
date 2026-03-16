
import mongoose, { ClientSession } from 'mongoose';
import { ITestDocument, ITestSubmissionDocument, TestDifficulty, TestStatus, SubmissionStatus } from '../interface/Test';
import { Test } from '../models/Test';
import { TestQueryParams, TestSubmissionQueryParams } from '../dto/test.dto';
import { TestSubmission } from '../models/TestSubmission';
import { UserRole } from '../../users/interface/User';
import { logger } from '../../../utils/logger';

/**
 * Allowed fields for user-safe updates (can be updated by the submission owner)
 * These fields are safe for users to modify and don't affect scoring or ownership
 */
const USER_SAFE_UPDATE_FIELDS = [
    'sourceCode',
    'languageId',
] as const;

/**
 * Allowed fields for admin-only updates (requires elevated privileges)
 * These fields affect scoring, ownership, or system state
 */
const ADMIN_ONLY_UPDATE_FIELDS = [
    'status',
    'testResults',
    'totalTestCases',
    'passedTestCases',
    'score',
    'executionTime',
    'userId',
    'testId',
] as const;

/**
 * Allowed fields for system/worker updates (internal use only)
 * Used by background workers processing submissions
 */
const SYSTEM_UPDATE_FIELDS = [
    'status',
    'testResults',
    'totalTestCases',
    'passedTestCases',
    'score',
    'executionTime',
] as const;

type UserSafeUpdateFields = typeof USER_SAFE_UPDATE_FIELDS[number];
type AdminOnlyUpdateFields = typeof ADMIN_ONLY_UPDATE_FIELDS[number];
type SystemUpdateFields = typeof SYSTEM_UPDATE_FIELDS[number];

/**
 * Update options for controlling field access
 */
export interface SubmissionUpdateOptions {
    /**
     * User ID performing the update (required for authorization checks)
     */
    userId?: string;
    /**
     * User role performing the update (required for authorization checks)
     */
    userRole?: UserRole;
    /**
     * If true, allows system/worker updates (bypasses ownership checks)
     * Should only be used by internal services/workers
     */
    isSystemUpdate?: boolean;
}

export class TestRepository {
    /**
     * Create a new test
     */
    async create(testData: Partial<ITestDocument>): Promise<ITestDocument> {
        const test = new Test(testData);
        return await test.save();
    }

    /**
     * Find test by ID
     */
    async findById(id: string): Promise<ITestDocument | null> {
        return await Test.findById(id)
            .populate('createdBy', 'firstName lastName email')
            .exec();
    }

    /**
     * Find test by ID without population (for internal use)
     */
    async findByIdRaw(id: string): Promise<ITestDocument | null> {
        return await Test.findById(id).exec();
    }

    /**
     * Find all tests with pagination and filtering
     */
    async findAll(params: TestQueryParams = {}): Promise<{
        tests: ITestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const {
            page = 1,
            limit = 10,
            search,
            difficulty,
            tags,
            status,
            createdBy,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = params;

        const query: any = { isActive: true };

        // Search functionality
        if (search && search !== "") {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Filter by difficulty
        if (difficulty) {
            query.difficulty = difficulty;
        }

        // Filter by tags
        if (tags && tags.length > 0) {
            query.tags = { $in: tags };
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by creator
        if (createdBy) {
            query.createdBy = new mongoose.Types.ObjectId(createdBy);
        }

        // Sort configuration
        const sortConfig: any = {};
        sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const [tests, total] = await Promise.all([
            Test.find(query)
                .populate('createdBy', 'firstName lastName email')
                .sort(sortConfig)
                .skip(skip)
                .limit(limit)
                .exec(),
            Test.countDocuments(query)
        ]);

        return {
            tests,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Find published tests for users
     */
    async findPublishedTests(params: TestQueryParams = {}): Promise<{
        tests: ITestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const paramsWithStatus = { ...params, status: TestStatus.PUBLISHED };
        return await this.findAll(paramsWithStatus);
    }

    /**
     * Update test by ID
     */
    async updateById(id: string, updateData: Partial<ITestDocument>): Promise<ITestDocument | null> {
        return await Test.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('createdBy', 'firstName lastName email')
            .exec();
    }

    /**
     * Delete test by ID (soft delete)
     */
    async deleteById(id: string): Promise<ITestDocument | null> {
        return await Test.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        ).exec();
    }

    /**
     * Hard delete test by ID
     */
    async hardDeleteById(id: string): Promise<ITestDocument | null> {
        return await Test.findByIdAndDelete(id).exec();
    }

    async removeUserAssignments(userId: string, session?: ClientSession): Promise<number> {
        const options: any = {};
        if (session) {
            options.session = session;
        }

        const result = await Test.updateMany(
            { assignedUsers: userId },
            { $pull: { assignedUsers: userId } },
            options
        );

        const modifiedCount = (result as any).modifiedCount ?? (result as any).nModified ?? 0;

        return modifiedCount;
    }

    /**
     * Find tests by creator
     */
    async findByCreator(createdBy: string, params: TestQueryParams = {}): Promise<{
        tests: ITestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const paramsWithCreator = { ...params, createdBy };
        return await this.findAll(paramsWithCreator);
    }

    /**
     * Get test statistics
     */
    async getTestStats(): Promise<{
        total: number;
        published: number;
        draft: number;
        archived: number;
        byDifficulty: Record<TestDifficulty, number>;
    }> {
        const [total, published, draft, archived, difficultyStats] = await Promise.all([
            Test.countDocuments({ isActive: true }),
            Test.countDocuments({ isActive: true, status: TestStatus.PUBLISHED }),
            Test.countDocuments({ isActive: true, status: TestStatus.DRAFT }),
            Test.countDocuments({ isActive: true, status: TestStatus.ARCHIVED }),
            Test.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$difficulty', count: { $sum: 1 } } }
            ])
        ]);

        const byDifficulty = {
            [TestDifficulty.EASY]: 0,
            [TestDifficulty.MEDIUM]: 0,
            [TestDifficulty.HARD]: 0
        };

        difficultyStats.forEach((stat: any) => {
            byDifficulty[stat._id as TestDifficulty] = stat.count;
        });

        return {
            total,
            published,
            draft,
            archived,
            byDifficulty
        };
    }

    // Test Submission Repository Methods

    /**
     * Create a new test submission
     */
    async createSubmission(submissionData: Partial<ITestSubmissionDocument>): Promise<ITestSubmissionDocument> {
        const submission = new TestSubmission(submissionData);
        return await submission.save();
    }

    /**
     * Find submission by ID
     */
    async findSubmissionById(id: string): Promise<ITestSubmissionDocument | null> {
        return await TestSubmission.findById(id)
            .populate('testId', 'title difficulty')
            .populate('userId', 'firstName lastName email')
            .exec();
    }

    /**
     * Filter update data to only include allowed fields
     * @private
     */
    private filterAllowedFields<T extends string>(
        updateData: Partial<ITestSubmissionDocument>,
        allowedFields: readonly T[]
    ): Partial<ITestSubmissionDocument> {
        const filtered: Partial<ITestSubmissionDocument> = {};
        for (const field of allowedFields) {
            if (field in updateData && updateData[field as keyof ITestSubmissionDocument] !== undefined) {
                (filtered as any)[field] = updateData[field as keyof ITestSubmissionDocument];
            }
        }
        return filtered;
    }

    /**
     * Validate that critical fields are not being changed without proper authorization
     * @private
     */
    private validateCriticalFieldChanges(
        existingSubmission: ITestSubmissionDocument,
        updateData: Partial<ITestSubmissionDocument>,
        options: SubmissionUpdateOptions
    ): void {
        const { userId, userRole, isSystemUpdate } = options;

        // System updates bypass ownership checks
        if (isSystemUpdate) {
            return;
        }

        // Check for ownership/score changes
        const criticalFields: Array<keyof ITestSubmissionDocument> = ['userId', 'testId', 'score', 'passedTestCases', 'totalTestCases'];
        const hasCriticalChanges = criticalFields.some(field =>
            field in updateData &&
            updateData[field] !== undefined &&
            String(existingSubmission[field]) !== String(updateData[field])
        );

        if (hasCriticalChanges) {
            // Only admins can change critical fields
            if (userRole !== UserRole.ADMIN) {
                throw new Error('Insufficient permissions: Only administrators can modify ownership, score, or test case counts');
            }

            // Even admins cannot change ownership to themselves or update their own scores
            // This prevents self-serving score manipulation
            if (userId && existingSubmission.userId) {
                const existingUserId = String(existingSubmission.userId);
                const updatingUserId = String(userId);

                // Prevent users from updating their own submission's score or ownership
                if (existingUserId === updatingUserId) {
                    throw new Error('Authorization denied: Users cannot modify their own submission scores or ownership');
                }

                // Prevent changing ownership to the updating user
                if ('userId' in updateData && updateData.userId) {
                    const newUserId = String(updateData.userId);
                    if (newUserId === updatingUserId) {
                        throw new Error('Authorization denied: Cannot transfer submission ownership to yourself');
                    }
                }
            }
        }
    }

    /**
     * Update submission by ID with field restrictions and authorization checks
     * 
     * @param id - Submission ID to update
     * @param updateData - Data to update (will be filtered based on permissions)
     * @param options - Update options including user context for authorization
     * @returns Updated submission document or null if not found
     * 
     * @throws Error if:
     * - User attempts to modify critical fields (userId, testId, score, etc.) without admin privileges
     * - User attempts to modify their own submission's score or ownership
     * - Invalid field updates are attempted
     * 
     * @example
     * // User-safe update (only sourceCode and languageId)
     * await repository.updateSubmissionById(id, { sourceCode: 'new code' }, { userId: 'user123', userRole: UserRole.STUDENT });
     * 
     * // Admin update (can update status, score, etc.)
     * await repository.updateSubmissionById(id, { status: 'completed', score: 100 }, { userId: 'admin123', userRole: UserRole.ADMIN });
     * 
     * // System/worker update (bypasses ownership checks)
     * await repository.updateSubmissionById(id, { status: 'completed', score: 95 }, { isSystemUpdate: true });
     */
    async updateSubmissionById(
        id: string,
        updateData: Partial<ITestSubmissionDocument>,
        options: SubmissionUpdateOptions = {}
    ): Promise<ITestSubmissionDocument | null> {
        const { userId, userRole, isSystemUpdate } = options;

        // Fetch existing submission for validation
        const existingSubmission = await this.findSubmissionById(id);
        if (!existingSubmission) {
            return null;
        }

        // Determine allowed fields based on user role and update type
        let allowedFields: readonly string[];
        if (isSystemUpdate) {
            allowedFields = SYSTEM_UPDATE_FIELDS;
        } else if (userRole === UserRole.ADMIN) {
            // Admins can update both user-safe and admin-only fields
            allowedFields = [...USER_SAFE_UPDATE_FIELDS, ...ADMIN_ONLY_UPDATE_FIELDS];
        } else {
            // Regular users can only update user-safe fields
            allowedFields = USER_SAFE_UPDATE_FIELDS;
        }

        // Filter update data to only include allowed fields
        const filteredUpdateData = this.filterAllowedFields(updateData, allowedFields);

        // Validate critical field changes
        this.validateCriticalFieldChanges(existingSubmission, filteredUpdateData, options);

        // Perform the update
        return await TestSubmission.findByIdAndUpdate(
            id,
            filteredUpdateData,
            { new: true, runValidators: true }
        )
            .populate('testId', 'title difficulty')
            .populate('userId', 'firstName lastName email')
            .exec();
    }

    /**
     * Update submission status (specialized method)
     * 
     * @param id - Submission ID
     * @param status - New status value
     * @param options - Update options for authorization
     * @returns Updated submission or null if not found
     * 
     * @throws Error if user lacks permission to update status
     * 
     * @remarks
     * - Regular users cannot update status (status is managed by the system)
     * - Admins can update status
     * - System/workers can update status
     */
    async updateSubmissionStatus(
        id: string,
        status: SubmissionStatus,
        options: SubmissionUpdateOptions = {}
    ): Promise<ITestSubmissionDocument | null> {
        return await this.updateSubmissionById(id, { status }, options);
    }

    /**
     * Update submission score and test case results (admin/system only)
     * 
     * @param id - Submission ID
     * @param scoreData - Score and test case data
     * @param options - Update options for authorization
     * @returns Updated submission or null if not found
     * 
     * @throws Error if:
     * - User is not admin or system
     * - User attempts to update their own score
     * 
     * @remarks
     * This method should only be used by:
     * - System workers processing submissions
     * - Administrators correcting scores
     * Regular users cannot update scores
     */
    async updateSubmissionScore(
        id: string,
        scoreData: {
            score: number;
            passedTestCases: number;
            totalTestCases: number;
            testResults?: ITestSubmissionDocument['testResults'];
            executionTime?: number;
        },
        options: SubmissionUpdateOptions = {}
    ): Promise<ITestSubmissionDocument | null> {
        const updateData: Partial<ITestSubmissionDocument> = {
            score: scoreData.score,
            passedTestCases: scoreData.passedTestCases,
            totalTestCases: scoreData.totalTestCases,
            ...(scoreData.testResults && { testResults: scoreData.testResults }),
            ...(scoreData.executionTime !== undefined && { executionTime: scoreData.executionTime }),
        };

        return await this.updateSubmissionById(id, updateData, options);
    }

    /**
     * Atomically upsert a submission (insert if not exists, update if exists)
     * 
     * This method performs a single atomic operation to avoid race conditions
     * when multiple workers try to save results for the same submission.
     * 
     * @param submissionId - Submission ID to upsert
     * @param updatePayload - Data to update/insert
     * @returns The upserted submission document
     * 
     * @remarks
     * - Uses MongoDB's findOneAndUpdate with upsert: true for atomicity
     * - Fields in $set are always updated (even on insert)
     * - Fields in $setOnInsert are only set when creating a new document
     * - This prevents duplicate key errors and lost updates in concurrent scenarios
     */
    async upsertSubmission(
        submissionId: string,
        updatePayload: {
            testId: string | mongoose.Types.ObjectId;
            userId: string | mongoose.Types.ObjectId;
            sourceCode: string;
            languageId: number;
            status: SubmissionStatus;
            testResults: ITestSubmissionDocument['testResults'];
            totalTestCases: number;
            passedTestCases: number;
            score: number;
            executionTime: number;
        }
    ): Promise<ITestSubmissionDocument> {
        const { testId, userId, sourceCode, languageId, status, testResults, totalTestCases, passedTestCases, score, executionTime } = updatePayload;

        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info('💾 [TestRepository] UPSERTING SUBMISSION');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info(`Submission ID: ${submissionId}`);
        logger.info(`Status: ${status}`);
        logger.info(`Test Results Count: ${testResults?.length || 0}`);
        logger.info(`Total Test Cases: ${totalTestCases}`);
        logger.info(`Passed Test Cases: ${passedTestCases}`);
        logger.info(`Score: ${score}%`);
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Convert string IDs to ObjectId if needed
        const testIdObj = typeof testId === 'string' ? new mongoose.Types.ObjectId(testId) : testId;
        const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        const submissionIdObj = new mongoose.Types.ObjectId(submissionId);

        // Build update operation with $set (always updates) and $setOnInsert (only on insert)
        const update: any = {
            $set: {
                testId: testIdObj,
                userId: userIdObj,
                sourceCode,
                languageId,
                status,
                testResults,
                totalTestCases,
                passedTestCases,
                score,
                executionTime,
            },
            $setOnInsert: {
                submittedAt: new Date(),
            },
        };

        try {
            // Perform atomic upsert
            const result = await TestSubmission.findOneAndUpdate(
                { _id: submissionIdObj },
                update,
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                }
            )
                .populate('testId', 'title difficulty')
                .populate('userId', 'firstName lastName email')
                .exec();

            if (!result) {
                logger.error(`❌ Failed to upsert submission ${submissionId} - result is null`);
                throw new Error(`Failed to upsert submission ${submissionId}`);
            }

            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info('✅ [TestRepository] SUBMISSION UPSERTED SUCCESSFULLY');
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info(`Submission ID: ${result._id}`);
            logger.info(`Status: ${result.status}`);
            logger.info(`Score: ${result.score}%`);
            logger.info(`Passed: ${result.passedTestCases}/${result.totalTestCases}`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            return result;
        } catch (error) {
            logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.error('❌ [TestRepository] UPSERT FAILED');
            logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.error(`Submission ID: ${submissionId}`);
            logger.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error && error.stack) {
                logger.error(`Stack: ${error.stack}`);
            }
            logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            throw error;
        }
    }

    /**
     * Find submissions with pagination and filtering
     */
    async findSubmissions(params: TestSubmissionQueryParams = {}): Promise<{
        submissions: ITestSubmissionDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        const {
            page = 1,
            limit = 10,
            testId,
            userId,
            sortBy = 'submittedAt',
            sortOrder = 'desc'
        } = params;

        const query: any = {};

        if (testId) {
            query.testId = new mongoose.Types.ObjectId(testId);
        }

        if (userId) {
            query.userId = new mongoose.Types.ObjectId(userId);
        }

        if (params.startDate || params.endDate) {
            query.submittedAt = {};
            if (params.startDate) {
                query.submittedAt.$gte = new Date(params.startDate);
            }
            if (params.endDate) {
                query.submittedAt.$lte = new Date(params.endDate);
            }
        }

        const sortConfig: any = {};
        sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const [submissions, total] = await Promise.all([
            TestSubmission.find(query)
                .populate('testId', 'title difficulty')
                .populate('userId', 'firstName lastName email')
                .sort(sortConfig)
                .skip(skip)
                .limit(limit)
                .exec(),
            TestSubmission.countDocuments(query)
        ]);

        return {
            submissions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Find user's submissions for a specific test
     */
    async findUserSubmissionsForTest(testId: string, userId: string): Promise<ITestSubmissionDocument[]> {
        return await TestSubmission.find({
            testId: new mongoose.Types.ObjectId(testId),
            userId: new mongoose.Types.ObjectId(userId)
        })
            .sort({ submittedAt: -1 })
            .exec();
    }

    /**
     * Get submission statistics for a test
     */
    async getTestSubmissionStats(testId: string): Promise<{
        totalSubmissions: number;
        uniqueUsers: number;
        averageScore: number;
        passRate: number;
    }> {
        const stats = await TestSubmission.aggregate([
            { $match: { testId: new mongoose.Types.ObjectId(testId) } },
            {
                $group: {
                    _id: null,
                    totalSubmissions: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    averageScore: { $avg: '$score' },
                    passedSubmissions: {
                        $sum: {
                            $cond: [{ $eq: ['$passedTestCases', '$totalTestCases'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    totalSubmissions: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                    averageScore: { $round: ['$averageScore', 2] },
                    passRate: {
                        $round: [
                            { $multiply: [{ $divide: ['$passedSubmissions', '$totalSubmissions'] }, 100] },
                            2
                        ]
                    }
                }
            }
        ]);

        return stats[0] || {
            totalSubmissions: 0,
            uniqueUsers: 0,
            averageScore: 0,
            passRate: 0
        };
    }


    /**
     * Find tests assigned to a specific user
     */
    async findByAssignedUser(userId: string, params: TestQueryParams = {}): Promise<{
        data: ITestDocument[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const {
            page = 1,
            limit = 10,
            search,
            difficulty,
            tags,
            status = TestStatus.PUBLISHED,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = params;

        const skip = (page - 1) * limit;

        // Build query for tests assigned to the user
        const query: any = {
            assignedUsers: { $in: [userId] },
            status: status,
            isActive: true
        };

        // Add search filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { problemStatement: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Add difficulty filter
        if (difficulty) {
            query.difficulty = difficulty;
        }

        if (tags && tags.length > 0) {
            query.tags = { $in: tags };
        }

        // Build sort object
        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const [data, total] = await Promise.all([
            Test.find(query)
                .sort(sortObj)
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'firstName lastName email')
                .exec(),
            Test.countDocuments(query)
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Get all submissions for a student within a date range for reporting
     */
    async getStudentReport(userId: string, startDate?: Date, endDate?: Date): Promise<ITestSubmissionDocument[]> {
        const query: any = {
            userId: new mongoose.Types.ObjectId(userId)
        };

        if (startDate || endDate) {
            query.submittedAt = {};
            if (startDate) {
                query.submittedAt.$gte = startDate;
            }
            if (endDate) {
                query.submittedAt.$lte = endDate;
            }
        }

        return await TestSubmission.find(query)
            .populate('testId', 'title difficulty')
            .sort({ submittedAt: -1 })
            .exec();
    }
}
