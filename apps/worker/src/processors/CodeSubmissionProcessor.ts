import { Job } from 'bullmq';
import { CodeSubmissionJobData } from '../types/queue.types';
import { TestExecutionService } from '../lib/services/TestExecutionService';
import logger from '@repo/logger';

export class CodeSubmissionProcessor {
    private testExecutionService: TestExecutionService;

    constructor() {
        this.testExecutionService = new TestExecutionService();
    }

    public async processJob(job: Job<CodeSubmissionJobData>): Promise<any> {
        const startTime = Date.now();
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info(' [CodeSubmissionWorker] RECEIVED CODE SUBMISSION JOB');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info(`Job ID: ${job.id}`);
        logger.info(`Submission ID: ${job.data.submissionId}`);
        logger.info(`Test ID: ${job.data.testId}`);
        logger.info(`User ID: ${job.data.userId}`);
        logger.info(`Language ID: ${job.data.languageId}`);
        logger.info(`Code Length: ${job.data.sourceCode?.length || 0} characters`);
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        try {
            logger.info(' [CodeSubmissionWorker] Starting code execution...');

            const { testId, userId, sourceCode, languageId, submissionId, testData } = job.data;

            // Execute code using test data from job (no database fetch needed)
            const result = await this.testExecutionService.executeWithTestData(
                sourceCode,
                languageId,
                testData,
                userId,
                submissionId,
                testId
            );

            const executionTime = Date.now() - startTime;

            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info(' [CodeSubmissionWorker] JOB COMPLETED SUCCESSFULLY');
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.info(`Job ID: ${job.id}`);
            logger.info(`Submission ID: ${submissionId}`);
            logger.info(`Total Test Cases: ${result.totalTestCases}`);
            logger.info(`Passed Test Cases: ${result.passedTestCases}`);
            logger.info(`Score: ${result.score}%`);
            logger.info(`Execution Time: ${result.executionTime}ms`);
            logger.info(`Total Processing Time: ${executionTime}ms`);
            logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

            // Return result (API will save to database)
            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;

            logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.error(' [CodeSubmissionWorker] JOB FAILED');
            logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            logger.error(`Job ID: ${job.id}`);
            logger.error(`Submission ID: ${job.data.submissionId}`);
            logger.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            logger.error(`Processing Time: ${executionTime}ms`);
            logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            throw error;
        }
    }
}
