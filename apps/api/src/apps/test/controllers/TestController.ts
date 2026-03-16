import { TestService } from "../services/TestService";
import { redisService } from "../../../core/infrastructure/Redis";
import { QueueClient } from "../../../core/infrastructure/QueueClient";
import mongoose from "mongoose";

import { CreateTestDto, UpdateTestDto, TestQueryParams, TestSubmissionQueryParams, TestSubmissionDto } from "../dto/test.dto";
import { IRequest, IResponse } from "../../../core/types";
import { ResponseUtils } from "../../../utils/responseUtils";
import { logger } from "../../../utils/logger";
import { SubmissionStatus } from '../interface/Test';



export class TestController {
    private testService: TestService;

    constructor() {
        this.testService = new TestService();
    }

    // Lazy-load QueueClient to avoid initialization order issues
    private get queueClient(): QueueClient {
        return redisService.getQueueClient();
    }

    /**
     * Create a new test (Admin only)
     */
    async createTest(req: IRequest, res: IResponse): Promise<void> {
        try {
            const testData: CreateTestDto = req.body;
            const createdBy = req.user?.id;

            if (!createdBy) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            const test = await this.testService.createTest(testData, createdBy);
            ResponseUtils.success(res, test, 'Test created successfully', 201);
        } catch (error) {
            logger.error('Error creating test:', error);
            ResponseUtils.error(res, error instanceof Error ? error.message : 'Failed to create test', 400);
        }
    }

    /**
     * Get all tests with pagination and filtering (Admin only)
     */
    async getAllTests(req: IRequest, res: IResponse): Promise<void> {
        try {
            const params: TestQueryParams = {
                page: parseInt(req.query['page'] as string) || 1,
                limit: parseInt(req.query['limit'] as string) || 10,
                search: req.query['search'] as string,
                difficulty: req.query['difficulty'] as any,
                tags: req.query['tags'] ? (req.query['tags'] as string).split(',') : undefined,
                status: req.query['status'] as any,
                createdBy: req.query['createdBy'] as string,
                sortBy: req.query['sortBy'] as any,
                sortOrder: req.query['sortOrder'] as any
            };

            const result = await this.testService.getAllTests(params);
            ResponseUtils.success(res, result, 'Tests retrieved successfully');
        } catch (error) {
            logger.error('Error getting all tests:', error);
            ResponseUtils.error(res, 'Failed to retrieve tests', 500);
        }
    }

    /**
     * Get published tests for users
     */
    async getPublishedTests(req: IRequest, res: IResponse): Promise<void> {
        try {
            const params: TestQueryParams = {
                page: parseInt(req.query['page'] as string) || 1,
                limit: parseInt(req.query['limit'] as string) || 10,
                search: req.query['search'] as string,
                difficulty: req.query['difficulty'] as any,
                tags: req.query['tags'] ? (req.query['tags'] as string).split(',') : undefined,
                sortBy: req.query['sortBy'] as any,
                sortOrder: req.query['sortOrder'] as any
            };

            const result = await this.testService.getPublishedTests(params);
            ResponseUtils.success(res, null, 'Published tests retrieved successfully');
        } catch (error) {
            logger.error('Error getting published tests:', error);
            ResponseUtils.error(res, 'Failed to retrieve published tests', 500);
        }
    }

    /**
     * Get test by ID (Admin - includes hidden test cases)
     */
    async getTestById(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }
            const test = await this.testService.getTestById(id, true); // Include hidden test cases for admin

            if (!test) {
                ResponseUtils.notFound(res, 'Test not found');
                return;
            }

            ResponseUtils.success(res, test, 'Test retrieved successfully');
        } catch (error) {
            logger.error('Error getting test by ID:', error);
            ResponseUtils.error(res, 'Failed to retrieve test', 500);
        }
    }

    /**
     * Get test by ID for users (excludes hidden test cases)
     */
    async getTestByIdForUser(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }

            const test = await this.testService.getTestForUser(id);
            if (!test) {
                ResponseUtils.notFound(res, 'Test not found');
                return;
            }

            ResponseUtils.success(res, test, 'Test retrieved successfully');
        } catch (error) {
            logger.error('Error getting test for user:', error);
            ResponseUtils.error(res, 'Failed to retrieve test', 500);
        }
    }

    /**
     * Get supported languages for a specific test
     */
    async getSupportedLanguages(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }

            const languages = await this.testService.getSupportedLanguagesForTest(id);
            if (!languages) {
                ResponseUtils.notFound(res, 'Test not found');
                return;
            }

            ResponseUtils.success(res, languages, 'Supported languages retrieved successfully');
        } catch (error) {
            logger.error('Error getting supported languages:', error);
            ResponseUtils.error(res, 'Failed to retrieve supported languages', 500);
        }
    }

    /**
     * Update test (Admin only)
     */
    async updateTest(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            const updateData: UpdateTestDto = req.body;
            const updatedBy = req.user?.id;

            logger.info(`Update test request for ID: ${id}, data:`, updateData);

            if (!updatedBy) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }

            const test = await this.testService.updateTest(id, updateData, updatedBy);
            if (!test) {
                ResponseUtils.notFound(res, 'Test not found');
                return;
            }

            ResponseUtils.success(res, test, 'Test updated successfully');
        } catch (error) {
            logger.error('Error updating test:', error);
            ResponseUtils.error(res, error instanceof Error ? error.message : 'Failed to update test', 400);
        }
    }

    /**
     * Delete test (Admin only)
     */
    async deleteTest(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            const deletedBy = req.user?.id;

            if (!deletedBy) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }

            const deleted = await this.testService.deleteTest(id, deletedBy);
            if (!deleted) {
                ResponseUtils.notFound(res, 'Test not found');
                return;
            }

            ResponseUtils.success(res, null, 'Test deleted successfully');
        } catch (error) {
            logger.error('Error deleting test:', error);
            ResponseUtils.error(res, error instanceof Error ? error.message : 'Failed to delete test', 400);
        }
    }

    /**
     * Publish test (Admin only)
     */
    async publishTest(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            const publishedBy = req.user?.id;

            if (!publishedBy) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }

            const test = await this.testService.publishTest(id, publishedBy);
            if (!test) {
                ResponseUtils.notFound(res, 'Test not found');
                return;
            }

            ResponseUtils.success(res, test, 'Test published successfully');
        } catch (error) {
            logger.error('Error publishing test:', error);
            ResponseUtils.error(res, error instanceof Error ? error.message : 'Failed to publish test', 400);
        }
    }

    /**
     * Archive test (Admin only)
     */
    async archiveTest(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            const archivedBy = req.user?.id;

            if (!archivedBy) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }

            const test = await this.testService.archiveTest(id, archivedBy);
            if (!test) {
                ResponseUtils.notFound(res, 'Test not found');
                return;
            }

            ResponseUtils.success(res, test, 'Test archived successfully');
        } catch (error) {
            logger.error('Error archiving test:', error);
            ResponseUtils.error(res, error instanceof Error ? error.message : 'Failed to archive test', 400);
        }
    }

    /**
     * Submit test solution
     */
    async submitTestSolution(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            const submissionData: TestSubmissionDto = req.body;
            const userId = req.user?.id;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }

            // === INPUT VALIDATION (SECURITY) ===
            const { sourceCode, languageId } = submissionData;

            // 1. Validate code size (max 100KB)
            const MAX_CODE_SIZE = 100 * 1024; // 100KB
            const codeSize = Buffer.byteLength(sourceCode, 'utf8');
            if (codeSize > MAX_CODE_SIZE) {
                ResponseUtils.badRequest(res,
                    `Code size (${Math.round(codeSize / 1024)}KB) exceeds maximum allowed (100KB)`);
                return;
            }

            // 2. Validate code is not empty
            const sanitizedCode = sourceCode.trim();
            if (sanitizedCode.length === 0) {
                ResponseUtils.badRequest(res, 'Source code cannot be empty');
                return;
            }

            // 3. Validate language ID against test's allowed languages
            // We need ALL test cases (including hidden ones) for the worker execution
            const test = await this.testService.getTestById(id, true);
            if (!test) {
                ResponseUtils.notFound(res, 'Test not found');
                return;
            }

            if (!test.allowedLanguages.includes(languageId)) {
                ResponseUtils.badRequest(res,
                    `Language ID ${languageId} is not allowed for this test. Allowed: ${test.allowedLanguages.join(', ')}`);
                return;
            }

            // 4. Validate language ID is a number
            if (typeof languageId !== 'number' || languageId < 1) {
                ResponseUtils.badRequest(res, 'Invalid language ID');
                return;
            }

            // Generate a new submission ID
            const submissionId = new mongoose.Types.ObjectId().toString();

            // Queue the code submission job
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info('📤 [QueueClient] QUEUING CODE SUBMISSION JOB');
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info(`Submission ID: ${submissionId}`);
            logger.info(`Test ID: ${id}`);
            logger.info(`User ID: ${userId}`);
            logger.info(`Language ID: ${languageId}`);
            logger.info(`Source Code Length: ${sanitizedCode.length} chars`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Add job to queue with ALL test data (worker won't need database)
            const jobId = await this.queueClient.addCodeSubmissionJob({
                submissionId,
                testId: id,
                userId,
                sourceCode: sanitizedCode,
                languageId: submissionData.languageId,
                // Include all test data so worker doesn't need database
                testData: {
                    title: test.title,
                    executeCodeName: test.executeCodeName,
                    constraints: test.constraints,
                    testCases: test.testCases.map(tc => ({
                        _id: tc._id?.toString() || '',
                        inputs: tc.inputs.map(input => ({
                            value: input.value,
                            order: input.order,
                            inputFormat: input.inputFormat
                        })),
                        expectedOutput: tc.expectedOutput,
                        isHidden: tc.isHidden,
                        outputFormat: tc.outputFormat
                    }))
                }
            });

            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info('✅ [QueueClient] JOB QUEUED SUCCESSFULLY');
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info(`Job ID: ${jobId}`);
            logger.info(`Submission ID: ${submissionId}`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            ResponseUtils.success(res, {
                submissionId,
                jobId,
                status: 'queued',
                message: 'Submission queued successfully'
            }, 'Test solution submitted successfully');
        } catch (error) {
            logger.error('Error submitting test solution:', error);
            ResponseUtils.error(res, error instanceof Error ? error.message : 'Failed to submit test solution', 400);
        }
    }

    /**
     * Get submission status
     */
    async getSubmissionStatus(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { submissionId } = req.params;
            if (!submissionId) {
                ResponseUtils.badRequest(res, 'Submission ID is required');
                return;
            }

            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info('🔍 [GET SUBMISSION STATUS] Request received');
            logger.info(`Submission ID: ${submissionId}`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Check if submission exists in database
            const submission = await this.testService.getSubmissionById(submissionId);

            if (!submission) {
                // If not found, it might be too recent or invalid ID
                logger.warn(`Submission not found: ${submissionId}`);
                ResponseUtils.success(res, {
                    status: SubmissionStatus.PROCESSING,
                    submissionId
                }, 'Submission is being processed');
                return;
            }

            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info('📦 Submission found in database');
            logger.info(`Submission Status: ${submission.status}`);
            logger.info(`Submission ID: ${submission._id}`);
            logger.info(`Score: ${submission.score}%`);
            logger.info(`Passed: ${submission.passedTestCases}/${submission.totalTestCases}`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Determine actual submission status
            // Normalize status to enum value for consistent comparison
            let actualStatus: SubmissionStatus;

            // If status exists, normalize it to enum value
            if (submission.status) {
                const statusStr = String(submission.status).toLowerCase();
                if (statusStr === 'completed' || statusStr === SubmissionStatus.COMPLETED) {
                    actualStatus = SubmissionStatus.COMPLETED;
                } else if (statusStr === 'failed' || statusStr === SubmissionStatus.FAILED) {
                    actualStatus = SubmissionStatus.FAILED;
                } else if (statusStr === 'pending' || statusStr === SubmissionStatus.PENDING) {
                    actualStatus = SubmissionStatus.PENDING;
                } else {
                    actualStatus = SubmissionStatus.PROCESSING;
                }
            } else if (submission.testResults && submission.testResults.length > 0) {
                // Submission has results but no status - mark as completed
                actualStatus = SubmissionStatus.COMPLETED;

                // NOTE: This is a side effect in a GET request - intentional data migration
                // When a submission has testResults but no status, we fix the data inconsistency
                // This should be rare and indicates a migration scenario or edge case
                const submissionIdStr = (submission._id as mongoose.Types.ObjectId).toString();

                try {
                    const updatedSubmission = await this.testService.updateSubmissionStatus(
                        submissionIdStr,
                        SubmissionStatus.COMPLETED,
                        undefined,
                        undefined,
                        true // isSystemUpdate: true - this is a system-level data consistency fix
                    );
                    if (updatedSubmission) {
                        logger.info(`[DATA MIGRATION] Updated missing status for submission ${submissionIdStr} to COMPLETED`);
                    } else {
                        logger.warn(`[DATA MIGRATION] Submission not found for status update: ${submissionIdStr}`);
                    }
                } catch (error) {
                    // Explicit error handling: log the failure but don't break the GET request
                    // The derived status will still be returned to the client
                    logger.error(`[DATA MIGRATION FAILED] Failed to update submission status for ${submissionIdStr}:`, error);
                    // Continue with derived status even if update fails
                }
            } else {
                // No status and no results - still processing
                actualStatus = SubmissionStatus.PROCESSING;
            }

            logger.info(`📊 Status determination: submission.status="${submission.status}", actualStatus="${actualStatus}"`);

            // Additional check: if we have testResults, it means processing is complete
            // This handles cases where status might not be set correctly but results exist
            const hasResults = submission.testResults && submission.testResults.length > 0;
            const isCompletedByResults = hasResults && (submission.totalTestCases > 0 || submission.score !== undefined);

            // Check actual submission status
            // Submission status can be: pending, processing, completed, failed
            // Also check if we have results as a signal that processing is complete
            if (actualStatus === SubmissionStatus.COMPLETED ||
                actualStatus === SubmissionStatus.FAILED ||
                isCompletedByResults) {

                // If we determined completion by results but status wasn't set, update it
                if (isCompletedByResults && actualStatus !== SubmissionStatus.COMPLETED && actualStatus !== SubmissionStatus.FAILED) {
                    actualStatus = SubmissionStatus.COMPLETED;
                    logger.info(`🔄 Status updated to COMPLETED based on testResults presence`);
                }
                logger.info(`✅ Returning ${actualStatus} status with full submission`);

                // Get test to check which test cases are hidden
                // submission.testId might be populated (object) or just an ID (string/ObjectId)
                let testId = submission.testId;
                if (testId && typeof testId === 'object' && '_id' in testId) {
                    testId = (testId as any)._id;
                }

                const test = await this.testService.getTestById(testId.toString(), true);

                // Filter out hidden test case results from the response
                const visibleTestResults = submission.testResults.filter(result => {
                    const testCase = test?.testCases.find(tc => tc._id?.toString() === result.testCaseId);
                    return testCase && !testCase.isHidden;
                });

                // Calculate visible test counts
                const visibleTestCasesTotal = test?.testCases.filter(tc => !tc.isHidden).length || 0;
                const passedVisibleTests = visibleTestResults.filter(r => r.passed).length;

                const filteredSubmission = {
                    ...submission.toObject(),
                    testResults: visibleTestResults,
                    // Keep original total counts for overall scoring
                    totalTestCases: submission.totalTestCases,
                    passedTestCases: submission.passedTestCases,
                    score: submission.score,
                    // Add metadata about hidden tests
                    visibleTestCasesTotal,
                    passedVisibleTests,
                    hasHiddenTests: test ? test.testCases.some(tc => tc.isHidden) : false
                };

                ResponseUtils.success(res, {
                    status: actualStatus,
                    submission: filteredSubmission
                }, `Submission ${actualStatus}`);
            } else {
                // Still processing (pending or processing)
                logger.info(`⏳ Returning ${actualStatus} status (submission.status="${submission.status}")`);
                ResponseUtils.success(res, {
                    status: actualStatus,
                    submission: {
                        _id: submission._id,
                        status: actualStatus
                    }
                }, 'Submission is being processed');
            }
        } catch (error) {
            logger.error('Error getting submission status:', error);
            ResponseUtils.error(res, 'Failed to retrieve submission status', 500);
        }
    }

    /**
     * Get user's submission history for a test
     */
    async getUserSubmissionHistory(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }

            const submissions = await this.testService.getUserSubmissionHistory(id, userId);
            ResponseUtils.success(res, submissions, 'Submission history retrieved successfully');
        } catch (error) {
            logger.error('Error getting user submission history:', error);
            ResponseUtils.error(res, 'Failed to retrieve submission history', 500);
        }
    }

    /**
     * Get test submissions (Admin only)
     */
    async getTestSubmissions(req: IRequest, res: IResponse): Promise<void> {
        try {
            const params: TestSubmissionQueryParams = {
                page: parseInt(req.query['page'] as string) || 1,
                limit: parseInt(req.query['limit'] as string) || 10,
                testId: req.query['testId'] as string,
                userId: req.query['userId'] as string,
                sortBy: req.query['sortBy'] as any,
                sortOrder: req.query['sortOrder'] as any
            };

            const result = await this.testService.getTestSubmissions(params);
            ResponseUtils.success(res, result, 'Test submissions retrieved successfully');
        } catch (error) {
            logger.error('Error getting test submissions:', error);
            ResponseUtils.error(res, 'Failed to retrieve test submissions', 500);
        }
    }

    /**
     * Get test statistics (Admin only)
     */
    async getTestStats(req: IRequest, res: IResponse): Promise<void> {
        try {
            const stats = await this.testService.getTestStats();
            ResponseUtils.success(res, stats, 'Test statistics retrieved successfully');
        } catch (error) {
            logger.error('Error getting test statistics:', error);
            ResponseUtils.error(res, 'Failed to retrieve test statistics', 500);
        }
    }

    /**
     * Get test submission statistics (Admin only)
     */
    async getTestSubmissionStats(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'Test ID is required');
                return;
            }
            const stats = await this.testService.getTestSubmissionStats(id);
            ResponseUtils.success(res, stats, 'Test submission statistics retrieved successfully');
        } catch (error) {
            logger.error('Error getting test submission statistics:', error);
            ResponseUtils.error(res, 'Failed to retrieve test submission statistics', 500);
        }
    }

    /**
     * Search tests
     */
    async searchTests(req: IRequest, res: IResponse): Promise<void> {
        try {
            const searchQuery = req.query['q'] as string;
            if (!searchQuery) {
                ResponseUtils.badRequest(res, 'Search query is required');
                return;
            }

            const params: TestQueryParams = {
                page: parseInt(req.query['page'] as string) || 1,
                limit: parseInt(req.query['limit'] as string) || 10,
                difficulty: req.query['difficulty'] as any,
                tags: req.query['tags'] ? (req.query['tags'] as string).split(',') : undefined,
                sortBy: req.query['sortBy'] as any,
                sortOrder: req.query['sortOrder'] as any
            };

            const result = await this.testService.searchTests(searchQuery, params);
            ResponseUtils.success(res, result, 'Search results retrieved successfully');
        } catch (error) {
            logger.error('Error searching tests:', error);
            ResponseUtils.error(res, 'Failed to search tests', 500);
        }
    }

    /**
     * Get tests by creator (Admin only)
     */
    async getTestsByCreator(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { creatorId } = req.params;
            if (!creatorId) {
                ResponseUtils.badRequest(res, 'Creator ID is required');
                return;
            }
            const params: TestQueryParams = {
                page: parseInt(req.query['page'] as string) || 1,
                limit: parseInt(req.query['limit'] as string) || 10,
                search: req.query['search'] as string,
                difficulty: req.query['difficulty'] as any,
                tags: req.query['tags'] ? (req.query['tags'] as string).split(',') : undefined,
                status: req.query['status'] as any,
                sortBy: req.query['sortBy'] as any,
                sortOrder: req.query['sortOrder'] as any
            };

            const result = await this.testService.getTestsByCreator(creatorId, params);
            ResponseUtils.success(res, result, 'Tests by creator retrieved successfully');
        } catch (error) {
            logger.error('Error getting tests by creator:', error);
            ResponseUtils.error(res, 'Failed to retrieve tests by creator', 500);
        }
    }

    /**
     * Get tests assigned to the current user
     */
    async getAssignedTests(req: IRequest, res: IResponse): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            const params: TestQueryParams = {
                page: parseInt(req.query['page'] as string) || 1,
                limit: parseInt(req.query['limit'] as string) || 10,
                search: req.query['search'] as string,
                difficulty: req.query['difficulty'] as any,
                tags: req.query['tags'] ? (Array.isArray(req.query['tags']) ? req.query['tags'] as string[] : [req.query['tags'] as string]) : undefined,
                sortBy: req.query['sortBy'] as any,
                sortOrder: req.query['sortOrder'] as any
            };

            const result = await this.testService.getAssignedTests(userId, params);
            ResponseUtils.success(res, result, 'Assigned tests retrieved successfully');
        } catch (error) {
            logger.error('Error getting assigned tests:', error);
            ResponseUtils.error(res, 'Failed to retrieve assigned tests', 500);
        }
    }

    /**
     * Safely parse a date from a query string parameter
     * @param dateString - The date string from query params
     * @returns Valid Date object or undefined if not present
     * @throws Error if date is present but invalid
     */
    private parseDateQuery(dateString: string | undefined): Date | undefined {
        if (!dateString || typeof dateString !== 'string' || dateString.trim() === '') {
            return undefined;
        }

        const date = new Date(dateString);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format: ${dateString}`);
        }

        return date;
    }

    /**
     * Get student report
     */
    async getStudentReport(req: IRequest, res: IResponse): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ResponseUtils.unauthorized(res, 'User not authenticated');
                return;
            }

            // Parse and validate startDate from query params
            let startDate: Date | undefined;
            const startDateString = req.query['startDate'] as string | undefined;
            if (startDateString && typeof startDateString === 'string' && startDateString.trim() !== '') {
                const parsedStartDate = new Date(startDateString);
                if (isNaN(parsedStartDate.getTime()) || parsedStartDate.toString() === 'Invalid Date') {
                    startDate = undefined;
                } else {
                    startDate = parsedStartDate;
                }
            }

            // Parse and validate endDate from query params
            let endDate: Date | undefined;
            const endDateString = req.query['endDate'] as string | undefined;
            if (endDateString && typeof endDateString === 'string' && endDateString.trim() !== '') {
                const parsedEndDate = new Date(endDateString);
                if (isNaN(parsedEndDate.getTime()) || parsedEndDate.toString() === 'Invalid Date') {
                    endDate = undefined;
                } else {
                    endDate = parsedEndDate;
                }
            }

            const report = await this.testService.getStudentReport(userId, startDate, endDate);
            ResponseUtils.success(res, report, 'Student report retrieved successfully');
        } catch (error) {
            logger.error('Error getting student report:', error);
            ResponseUtils.error(res, 'Failed to retrieve student report', 500);
        }
    }

    /**
     * Get admin student report
     */
    async getAdminStudentReport(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { userId } = req.params;
            if (!userId) {
                ResponseUtils.badRequest(res, 'User ID is required');
                return;
            }

            // Validate userId format (ObjectId)
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                ResponseUtils.badRequest(res, `Invalid userId format: ${userId}. Must be a valid ObjectId`);
                return;
            }

            // Parse and validate startDate from query params
            let startDate: Date | undefined;
            const startDateString = req.query['startDate'] as string | undefined;
            if (startDateString && typeof startDateString === 'string' && startDateString.trim() !== '') {
                const parsedStartDate = new Date(startDateString);
                if (isNaN(parsedStartDate.getTime()) || parsedStartDate.toString() === 'Invalid Date') {
                    startDate = undefined;
                } else {
                    startDate = parsedStartDate;
                }
            }

            // Parse and validate endDate from query params
            let endDate: Date | undefined;
            const endDateString = req.query['endDate'] as string | undefined;
            if (endDateString && typeof endDateString === 'string' && endDateString.trim() !== '') {
                const parsedEndDate = new Date(endDateString);
                if (isNaN(parsedEndDate.getTime()) || parsedEndDate.toString() === 'Invalid Date') {
                    endDate = undefined;
                } else {
                    endDate = parsedEndDate;
                }
            }

            const report = await this.testService.getStudentReport(userId, startDate, endDate);
            ResponseUtils.success(res, report, 'Student report retrieved successfully');
        } catch (error) {
            logger.error('Error getting admin student report:', error);
            ResponseUtils.error(res, 'Failed to retrieve student report', 500);
        }
    }
}