
import mongoose from 'mongoose';
import { TestRepository } from '../repository/TestRepository';
import { TestExecutionService } from './TestExecutionService';
import { UserService } from '../../users/services/UserService';
import { ITestCase, ITestDocument, ITestSubmissionDocument, TestDifficulty, TestStatus, SubmissionStatus } from '../interface/Test';
import { CreateTestDto, UpdateTestDto, TestQueryParams, TestSubmissionQueryParams, TestSubmissionDto } from '../dto/test.dto';
import { User } from '../../users/models/User';
import { logger } from '../../../utils/logger';
import EmailService from '../../../core/services/EmailService';
import { getLanguagesByIds } from '../../../constants/languages';

export class TestService {
    private testRepository: TestRepository;
    private testExecutionService: TestExecutionService;
    private userService: UserService | null = null;
    private emailService: EmailService | null = null;

    constructor() {
        this.testRepository = new TestRepository();
        this.testExecutionService = new TestExecutionService();
    }

    /**
     * Lazy getter for user service to avoid Redis dependency during instantiation
     */
    private getUserService(): UserService {
        if (!this.userService) {
            this.userService = new UserService();
        }
        return this.userService;
    }

    /**
     * Lazy getter for email service to avoid Redis dependency on construction
     */
    private getEmailService(): EmailService {
        if (!this.emailService) {
            this.emailService = new EmailService();
        }
        return this.emailService;
    }

    private async sendTestAssignmentEmails(
        test: ITestDocument,
        userIds: string[],
        reason: 'created' | 'updated'
    ): Promise<void> {
        const uniqueUserIds = Array.from(new Set((userIds || []).filter(Boolean).map(id => id.toString())));
        if (uniqueUserIds.length === 0) {
            return;
        }

        try {
            const users = await this.getUserService().getUsersByIds(uniqueUserIds);
            if (!users || users.length === 0) {
                logger.warn(`No user records found for test assignment emails`, {
                    testId: test._id?.toString(),
                    count: uniqueUserIds.length
                });
                return;
            }

            await Promise.all(
                users
                    .filter(user => Boolean(user?.email))
                    .map(user => this.getEmailService().sendTestAssignmentEmail(
                        user.email,
                        {
                            userName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Learner',
                            testId: (test._id as any).toString(),
                            testTitle: test.title,
                            difficulty: test.difficulty,
                            tags: Array.isArray(test.tags) ? test.tags : [],
                            reason
                        }
                    ))
            );

            logger.info(`Queued ${users.length} test assignment emails`, {
                testId: test._id?.toString(),
                reason,
                recipients: users.length
            });
        } catch (error) {
            logger.warn(`Failed to send test assignment emails`, {
                testId: test._id?.toString(),
                reason,
                error: error instanceof Error ? error.message : error
            });
        }
    }

    /**
     * Get user IDs based on college filter criteria
     */
    async getUserIdsFromCollegeFilters(collegeData: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }): Promise<string[]> {
        try {
            console.log("Getting users for college filter:", collegeData);

            // Build the query filter
            const filter: any = {
                "college._id": new mongoose.Types.ObjectId(collegeData._id),
                isActive: true
            };

            // Add branch filter if provided
            if (collegeData.branches && collegeData.branches.length > 0) {
                filter["branch._id"] = {
                    $in: collegeData.branches.map(branch => new mongoose.Types.ObjectId(branch._id))
                };
            }

            // Add year filter if provided
            if (collegeData.year && collegeData.year.length > 0) {
                filter.collegeYear = { $in: collegeData.year };
            }

            const users = await User.find(filter);
            console.log(`Found ${users.length} users for college ${collegeData._id}`);

            return users.map(user => (user._id as mongoose.Types.ObjectId).toString());

        } catch (error) {
            logger.error(`Error getting user IDs for college filters:`, error);
            return [];
        }
    }

    /**
     * Create a new test
     */
    async createTest(testData: CreateTestDto, createdBy: string): Promise<ITestDocument> {
        try {
            // Validate test cases
            for (const testCase of testData.testCases) {
                const validation = this.testExecutionService.validateTestCase(testCase);
                if (!validation.isValid) {
                    throw new Error(validation.error);
                }
            }

            if (!testData.allowedLanguages || testData.allowedLanguages.length === 0) {
                throw new Error('At least one programming language must be allowed');
            }

            // Handle assigned users - if assignAllUsers is true, fetch all user IDs
            let assignedUserIds: string[] = [];
            if (testData.assignAllUsers) {
                // Get all active users
                const allUsers = await this.getUserService().getAllUsers(1, 1000); // Get up to 1000 users
                assignedUserIds = allUsers.users.map(user => user._id.toString());
                if (assignedUserIds.length === 0) {
                    throw new Error('No users found in the system');
                }
            } else {
                assignedUserIds = testData.assignedUsers || [];
            }

            // Handle college-based user assignment
            if (testData.colleges && testData.colleges.length > 0) {
                const collegeUserIds = await Promise.all(
                    testData.colleges.map(async (college) => {
                        return await this.getUserIdsFromCollegeFilters(college);
                    })
                );

                // Flatten the array and add to assigned users
                const flattenedUserIds = collegeUserIds.flat();
                assignedUserIds = [...assignedUserIds, ...flattenedUserIds];

                // Remove duplicates
                assignedUserIds = [...new Set(assignedUserIds)];
            }

            const test = await this.testRepository.create({
                ...testData,
                assignedUsers: assignedUserIds,
                createdBy,
                starterCode: testData.starterCode ? new Map(Object.entries(testData.starterCode).map(([k, v]) => [k.toString(), v])) : new Map(),
                status: testData.status || TestStatus.DRAFT
            });

            logger.info(`Test created successfully: ${test._id} with ${assignedUserIds.length} assigned users`);

            if (assignedUserIds.length > 0) {
                this.sendTestAssignmentEmails(test, assignedUserIds, 'created').catch(error => {
                    logger.warn(`Failed to queue test assignment emails after creation`, {
                        testId: test._id?.toString(),
                        error: error instanceof Error ? error.message : error
                    });
                });
            }
            return test;

        } catch (error) {
            logger.error('Error creating test:', error);
            throw error;
        }
    }

    /**
     * Get test by ID
     */
    async getTestById(id: string, includeHiddenTestCases: boolean = false): Promise<ITestDocument | null> {
        try {
            const test = await this.testRepository.findById(id);
            if (!test) {
                return null;
            }

            // If not including hidden test cases, filter them out
            if (!includeHiddenTestCases) {
                test.testCases = test.testCases.filter((testCase: ITestCase) => !testCase.isHidden);
            }

            return test;

        } catch (error) {
            logger.error('Error getting test by ID:', error);
            throw error;
        }
    }

    /**
     * Get all tests with pagination and filtering
     */
    async getAllTests(params: TestQueryParams = {}): Promise<{
        data: ITestDocument[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        try {
            const result = await this.testRepository.findAll(params);
            return {
                data: result.tests,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages
                }
            };
        } catch (error) {
            console.log("ERROR", error);
            logger.error('Error getting all tests:', error);
            throw error;
        }
    }

    /**
     * Get published tests for users
     */
    async getPublishedTests(params: TestQueryParams = {}): Promise<{
        data: ITestDocument[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        try {
            const result = await this.testRepository.findPublishedTests(params);
            return {
                data: result.tests,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: result.totalPages
                }
            };
        } catch (error) {
            logger.error('Error getting published tests:', error);
            throw error;
        }
    }

    /**
     * Update test
     */
    async updateTest(id: string, updateData: UpdateTestDto, updatedBy: string): Promise<ITestDocument | null> {
        try {
            // Check if test exists and user has permission
            const existingTest = await this.testRepository.findByIdRaw(id);
            if (!existingTest) {
                throw new Error('Test not found');
            }

            const previousAssignedSet = new Set(
                (existingTest.assignedUsers || []).map((assignedUser: any) => {
                    if (!assignedUser) {
                        return '';
                    }
                    if (typeof assignedUser === 'string') {
                        return assignedUser;
                    }
                    if (assignedUser?._id) {
                        return assignedUser._id.toString();
                    }
                    if (typeof assignedUser.toString === 'function') {
                        return assignedUser.toString();
                    }
                    return String(assignedUser);
                })
            );

            if (existingTest.createdBy.toString() !== updatedBy) {
                throw new Error('You do not have permission to update this test');
            }

            // Debug logging for assignment data
            logger.info(`Test update request for ${id}:`, {
                colleges: updateData.colleges,
                collegesLength: updateData.colleges?.length,
                assignedUsers: updateData.assignedUsers,
                assignedUsersLength: updateData.assignedUsers?.length,
                assignAllUsers: updateData.assignAllUsers,
                existingAssignedUsers: existingTest.assignedUsers?.length || 0,
                existingColleges: existingTest.colleges?.length || 0
            });

            // Validate test cases if provided
            if (updateData.testCases) {
                for (const testCase of updateData.testCases) {
                    const validation = this.testExecutionService.validateTestCase(testCase);
                    if (!validation.isValid) {
                        throw new Error(validation.error);
                    }
                }
            }

            // Convert starterCode from Record to Map if provided
            const processedUpdateData: any = { ...updateData };
            if (updateData.starterCode) {
                // Mongoose maps require string keys, so convert number keys to strings
                processedUpdateData.starterCode = new Map(Object.entries(updateData.starterCode).map(([k, v]) => [k.toString(), v]));
                logger.info(`Converting starterCode for update: ${JSON.stringify(updateData.starterCode)} -> Map with ${processedUpdateData.starterCode.size} entries`);
            }

            // Handle assigned users - completely recalculate based on current assignment criteria
            // This ensures that removed colleges/branches/years don't leave orphaned users
            let assignedUserIds: string[] = [];
            let newlyAssignedUserIds: string[] = [];

            logger.info(`Starting user assignment recalculation for test ${id}`);

            if (updateData.assignAllUsers) {
                logger.info(`assignAllUsers is true, fetching all active users`);
                // Get all active users
                const allUsers = await this.getUserService().getAllUsers(1, 1000);
                assignedUserIds = allUsers.users.map(user => user._id.toString());
                if (assignedUserIds.length === 0) {
                    throw new Error('No users found in the system');
                }
                logger.info(`Found ${assignedUserIds.length} active users for assignAllUsers`);
            } else {
                // Start with individual assigned users (from the update request, not existing)
                // This is crucial: we use ONLY the users from the request, not merging with existing
                assignedUserIds = updateData.assignedUsers || [];
                logger.info(`Starting with ${assignedUserIds.length} individual assigned users from request (ignoring ${existingTest.assignedUsers?.length || 0} existing users)`);
            }

            // Handle college-based user assignment
            if (updateData.colleges !== undefined) {
                if (updateData.colleges.length > 0) {
                    logger.info(`Processing ${updateData.colleges.length} colleges for user assignment`);
                    const collegeUserIds = await Promise.all(
                        updateData.colleges.map(async (college) => {
                            const users = await this.getUserIdsFromCollegeFilters(college);
                            logger.info(`College ${college._id} contributed ${users.length} users`);
                            return users;
                        })
                    );

                    // Flatten the array and add to assigned users
                    const flattenedUserIds = collegeUserIds.flat();
                    logger.info(`Total users from colleges: ${flattenedUserIds.length}`);
                    assignedUserIds = [...assignedUserIds, ...flattenedUserIds];

                    // Remove duplicates
                    assignedUserIds = [...new Set(assignedUserIds)];
                    logger.info(`Final assigned users after deduplication: ${assignedUserIds.length}`);
                } else {
                    logger.info(`Empty colleges array provided - no college-based users will be assigned`);
                }
            } else {
                logger.info(`No colleges field provided in update - keeping existing college-based assignments`);
            }

            // Always update assignedUsers when any assignment field is provided in the update
            // This ensures removed colleges/branches/years are properly handled
            const assignmentFieldsProvided = updateData.colleges !== undefined
                || updateData.assignedUsers !== undefined
                || updateData.assignAllUsers !== undefined;

            if (assignmentFieldsProvided) {
                assignedUserIds = Array.from(new Set(assignedUserIds.map(id => id.toString())));
                newlyAssignedUserIds = assignedUserIds.filter(id => !previousAssignedSet.has(id));
                processedUpdateData.assignedUsers = assignedUserIds;
                logger.info(`Will update assignedUsers field with ${assignedUserIds.length} users`);
                logger.info(`Assignment fields provided: colleges=${updateData.colleges !== undefined}, assignedUsers=${updateData.assignedUsers !== undefined}, assignAllUsers=${updateData.assignAllUsers !== undefined}`);
            } else {
                logger.info(`No assignment fields provided in update, keeping existing assigned users`);
            }

            logger.info(`Updating test ${id} with data and ${assignedUserIds.length} assigned users`);
            logger.info(`Final processedUpdateData.assignedUsers:`, processedUpdateData.assignedUsers);

            const updatedTest = await this.testRepository.updateById(id, processedUpdateData);
            if (updatedTest) {
                logger.info(`Test updated successfully: ${id}`);
                logger.info(`Updated test assignedUsers length: ${updatedTest.assignedUsers?.length || 0}`);
                logger.info(`Updated test colleges length: ${updatedTest.colleges?.length || 0}`);

                if (newlyAssignedUserIds.length > 0) {
                    this.sendTestAssignmentEmails(updatedTest, newlyAssignedUserIds, 'updated').catch(error => {
                        logger.warn(`Failed to queue test assignment emails after update`, {
                            testId: id,
                            error: error instanceof Error ? error.message : error
                        });
                    });
                }
            }

            return updatedTest;

        } catch (error) {
            logger.error('Error updating test:', error);
            throw error;
        }
    }

    /**
     * Delete test (soft delete)
     */
    async deleteTest(id: string, deletedBy: string): Promise<boolean> {
        try {
            // Check if test exists and user has permission
            const existingTest = await this.testRepository.findByIdRaw(id);
            if (!existingTest) {
                throw new Error('Test not found');
            }

            if (existingTest.createdBy.toString() !== deletedBy) {
                throw new Error('You do not have permission to delete this test');
            }

            const deletedTest = await this.testRepository.deleteById(id);
            if (deletedTest) {
                logger.info(`Test deleted successfully: ${id}`);
                return true;
            }

            return false;

        } catch (error) {
            logger.error('Error deleting test:', error);
            throw error;
        }
    }

    /**
     * Publish test
     */
    async publishTest(id: string, publishedBy: string): Promise<ITestDocument | null> {
        try {
            // Check if test exists and user has permission
            const existingTest = await this.testRepository.findByIdRaw(id);
            if (!existingTest) {
                throw new Error('Test not found');
            }

            if (existingTest.createdBy.toString() !== publishedBy) {
                throw new Error('You do not have permission to publish this test');
            }

            // Validate test before publishing
            if (!existingTest.testCases || existingTest.testCases.length === 0) {
                throw new Error('Test must have at least one test case to be published');
            }

            const updatedTest = await this.testRepository.updateById(id, { status: TestStatus.PUBLISHED });
            if (updatedTest) {
                logger.info(`Test published successfully: ${id}`);
            }

            return updatedTest;

        } catch (error) {
            logger.error('Error publishing test:', error);
            throw error;
        }
    }

    /**
     * Archive test
     */
    async archiveTest(id: string, archivedBy: string): Promise<ITestDocument | null> {
        try {
            // Check if test exists and user has permission
            const existingTest = await this.testRepository.findByIdRaw(id);
            if (!existingTest) {
                throw new Error('Test not found');
            }

            if (existingTest.createdBy.toString() !== archivedBy) {
                throw new Error('You do not have permission to archive this test');
            }

            const updatedTest = await this.testRepository.updateById(id, { status: TestStatus.ARCHIVED });
            if (updatedTest) {
                logger.info(`Test archived successfully: ${id}`);
            }

            return updatedTest;

        } catch (error) {
            logger.error('Error archiving test:', error);
            throw error;
        }
    }

    /**
     * Submit test solution
     */
    async submitTestSolution(
        testId: string,
        submissionData: TestSubmissionDto,
        userId: string
    ): Promise<{
        totalTestCases: number;
        passedTestCases: number;
        score: number;
        executionTime: number;
        testResults: any[];
    }> {
        try {
            return await this.testExecutionService.executeTestSubmission(
                testId,
                submissionData.sourceCode,
                submissionData.languageId,
                userId
            );
        } catch (error) {
            logger.error('Error submitting test solution:', error);
            throw error;
        }
    }

    /**
     * Get user's submission history for a test
     */
    async getUserSubmissionHistory(testId: string, userId: string): Promise<ITestSubmissionDocument[]> {
        try {
            return await this.testExecutionService.getUserSubmissionHistory(testId, userId);
        } catch (error) {
            logger.error('Error getting user submission history:', error);
            throw error;
        }
    }

    /**
     * Get test submissions with pagination
     */
    async getTestSubmissions(params: TestSubmissionQueryParams = {}): Promise<{
        submissions: ITestSubmissionDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            return await this.testRepository.findSubmissions(params);
        } catch (error) {
            logger.error('Error getting test submissions:', error);
            throw error;
        }
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
        try {
            return await this.testRepository.getTestStats();
        } catch (error) {
            logger.error('Error getting test statistics:', error);
            throw error;
        }
    }

    /**
     * Get test submission statistics
     */
    async getTestSubmissionStats(testId: string): Promise<{
        totalSubmissions: number;
        uniqueUsers: number;
        averageScore: number;
        passRate: number;
    }> {
        try {
            return await this.testExecutionService.getTestSubmissionStats(testId);
        } catch (error) {
            logger.error('Error getting test submission statistics:', error);
            throw error;
        }
    }

    /**
     * Search tests
     */
    async searchTests(searchQuery: string, params: TestQueryParams = {}): Promise<{
        tests: ITestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const searchParams = { ...params, search: searchQuery };
            return await this.testRepository.findAll(searchParams);
        } catch (error) {
            logger.error('Error searching tests:', error);
            throw error;
        }
    }

    /**
     * Get tests by creator
     */
    async getTestsByCreator(createdBy: string, params: TestQueryParams = {}): Promise<{
        tests: ITestDocument[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            return await this.testRepository.findByCreator(createdBy, params);
        } catch (error) {
            logger.error('Error getting tests by creator:', error);
            throw error;
        }
    }

    async getAssignedTests(userId: string, params: TestQueryParams): Promise<{
        data: ITestDocument[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        try {
            return await this.testRepository.findByAssignedUser(userId, params);
        } catch (error) {
            logger.error('Error getting assigned tests:', error);
            throw error;
        }
    }

    /**
     * Get submission by ID
     */
    async getSubmissionById(submissionId: string): Promise<ITestSubmissionDocument | null> {
        try {
            return await this.testRepository.findSubmissionById(submissionId);
        } catch (error) {
            logger.error('Error getting submission by ID:', error);
            throw error;
        }
    }

    /**
     * Get test for user (excludes hidden test cases)
     */
    async getTestForUser(testId: string) {
        try {
            return await this.getTestById(testId, false); // false = exclude hidden test cases
        } catch (error) {
            logger.error('Error getting test for user:', error);
            throw error;
        }
    }

    /**
     * Get supported languages for a specific test
     */
    async getSupportedLanguagesForTest(testId: string) {
        try {
            const test = await this.testRepository.findByIdRaw(testId);
            if (!test) {
                return null;
            }

            // Return only languages that are allowed for this test
            return getLanguagesByIds(test.allowedLanguages);
        } catch (error) {
            logger.error('Error getting supported languages for test:', error);
            throw error;
        }
    }

    /**
     * Update submission status
     * 
     * @param submissionId - Submission ID to update
     * @param status - New status value
     * @param userId - Optional user ID performing the update (for authorization)
     * @param userRole - Optional user role (for authorization)
     * @param isSystemUpdate - If true, bypasses authorization checks (for worker/system updates)
     * @returns Updated submission document, or null if submission not found
     */
    async updateSubmissionStatus(
        submissionId: string,
        status: SubmissionStatus,
        userId?: string,
        userRole?: string,
        isSystemUpdate: boolean = false
    ): Promise<ITestSubmissionDocument | null> {
        try {
            // First verify the submission exists
            const existingSubmission = await this.testRepository.findSubmissionById(submissionId);
            if (!existingSubmission) {
                logger.warn(`Submission not found for status update: ${submissionId}`);
                return null;
            }

            // Perform the update
            const updatedSubmission = await this.testRepository.updateSubmissionStatus(
                submissionId,
                status,
                {
                    userId,
                    userRole: userRole as any,
                    isSystemUpdate
                }
            );

            return updatedSubmission;
        } catch (error) {
            logger.error(`Failed to update submission status for submissionId ${submissionId}:`, error);
            throw new Error(`Failed to update submission status for submissionId ${submissionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Save submission result from worker (NEW: for database-free worker architecture)
     * 
     * This method is used by background workers to save submission results.
     * It uses system update mode to bypass authorization checks since workers
     * are trusted system components.
     */
    async saveSubmissionResult(result: any): Promise<void> {
        try {
            const { submissionId, testId, userId, sourceCode, languageId, status, testResults, totalTestCases, passedTestCases, score, executionTime } = result;

            // Normalize status: ensure it's a valid SubmissionStatus enum value
            // Worker returns 'completed' or 'failed' as strings, map them to enum values
            let normalizedStatus: SubmissionStatus;
            if (status === 'completed' || status === SubmissionStatus.COMPLETED) {
                normalizedStatus = SubmissionStatus.COMPLETED;
            } else if (status === 'failed' || status === SubmissionStatus.FAILED) {
                normalizedStatus = SubmissionStatus.FAILED;
            } else {
                // Default to completed if status is missing or invalid (job completed successfully)
                normalizedStatus = SubmissionStatus.COMPLETED;
            }

            // Use atomic upsert to avoid race conditions when multiple workers
            // try to save results for the same submission simultaneously
            await this.testRepository.upsertSubmission(submissionId, {
                testId,
                userId,
                sourceCode,
                languageId,
                status: normalizedStatus,
                testResults,
                totalTestCases,
                passedTestCases,
                score,
                executionTime,
            });

            logger.info(`Submission result saved with status: ${normalizedStatus}`, 'TestService', {
                submissionId,
                status: normalizedStatus
            });
        } catch (error) {
            logger.error('Failed to save submission result', 'TestService', {
                submissionId: result?.submissionId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Failed to save submission result: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Save failed submission (NEW: for database-free worker architecture)
     */
    async saveFailedSubmission(submissionId: string, errorMessage: string): Promise<void> {
        try {
            const submissionData = {
                _id: submissionId,
                status: 'failed',
                errorMessage,
                submittedAt: new Date()
            };

            await this.testRepository.createSubmission(submissionData as any);
        } catch (error) {
            throw new Error(`Failed to save failed submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get aggregated student report
     */
    async getStudentReport(userId: string, startDate?: Date, endDate?: Date) {
        try {
            const submissions = await this.testRepository.getStudentReport(userId, startDate, endDate);

            const totalSubmissions = submissions.length;
            let passedSubmissions = 0;
            let totalScore = 0;

            const detailedSubmissions = submissions.map(sub => {
                // Validate that passedTestCases and totalTestCases are present and valid numbers
                const hasValidPassedTestCases = sub.passedTestCases != null &&
                    Number.isFinite(sub.passedTestCases) &&
                    Number.isInteger(sub.passedTestCases) &&
                    sub.passedTestCases >= 0;
                const hasValidTotalTestCases = sub.totalTestCases != null &&
                    Number.isFinite(sub.totalTestCases) &&
                    Number.isInteger(sub.totalTestCases) &&
                    sub.totalTestCases >= 0;

                // Only mark as passed if status is completed, both values are valid, and they are equal
                const isPassed = sub.status === 'completed' &&
                    hasValidPassedTestCases &&
                    hasValidTotalTestCases &&
                    sub.passedTestCases === sub.totalTestCases;
                if (isPassed) passedSubmissions++;
                totalScore += sub.score || 0;

                return {
                    submissionId: sub._id,
                    testId: (sub.testId as any)?._id || sub.testId,
                    testTitle: (sub.testId as any)?.title || 'Unknown Test',
                    testDifficulty: (sub.testId as any)?.difficulty,
                    score: sub.score,
                    status: sub.status,
                    submittedAt: sub.submittedAt,
                    passedTestCases: sub.passedTestCases,
                    totalTestCases: sub.totalTestCases
                };
            });

            const averageScore = totalSubmissions > 0 ? totalScore / totalSubmissions : 0;
            const passRate = totalSubmissions > 0 ? (passedSubmissions / totalSubmissions) * 100 : 0;

            return {
                stats: {
                    totalSubmissions,
                    passedSubmissions,
                    failedSubmissions: totalSubmissions - passedSubmissions,
                    averageScore: parseFloat(averageScore.toFixed(2)),
                    passRate: parseFloat(passRate.toFixed(2))
                },
                submissions: detailedSubmissions
            };

        } catch (error) {
            logger.error('Error getting student report:', error);
            throw error;
        }
    }
}
