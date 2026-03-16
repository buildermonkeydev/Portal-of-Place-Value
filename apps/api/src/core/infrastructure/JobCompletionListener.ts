import { QueueEvents } from 'bullmq';
import { redisService } from './Redis';
import { TestService } from '../../apps/test/services/TestService';
import logger from '@repo/logger';

/**
 * Job completion listener for code submissions
 * Listens for worker job completions and saves results to MongoDB
 */
export class JobCompletionListener {
    private queueEvents: QueueEvents | null = null;
    private testService: TestService;

    constructor() {
        this.testService = new TestService();
    }

    /**
     * Start listening for job completions
     */
    public async start(): Promise<void> {
        try {
            // Get Redis config from redisService
            const config = redisService.getConfig();

            // Validate config is available and has required redis properties
            if (!config?.redis) {
                throw new Error('Redis config is not available. Ensure Redis service is initialized.');
            }
            if (!config.redis.host || !config.redis.port) {
                throw new Error('Redis config is incomplete. Missing host or port.');
            }

            // Use QueueEvents with dedicated connection config
            // This ensures BullMQ creates its own blocking connection for Pub/Sub
            this.queueEvents = new QueueEvents('code-submissions-queue', {
                connection: {
                    host: config.redis.host,
                    port: config.redis.port,
                    password: config.redis.password,
                    db: config.redis.db,
                    // Important: Increase timeout for blocking connection
                    connectTimeout: 60000,
                    commandTimeout: 60000
                }
            });

            // Listen for completed jobs
            this.queueEvents.on('completed', async ({ jobId, returnvalue }) => {
                try {
                    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    logger.info('🎉 [JobCompletionListener] JOB COMPLETED EVENT RECEIVED');
                    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    logger.info(`Job ID: ${jobId}`);
                    logger.info(`Has Return Value: ${!!returnvalue}`);
                    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                    if (!returnvalue) {
                        logger.warn('⚠️ Job completed but no return value', 'JobCompletionListener', { jobId });
                        return;
                    }

                    // Parse result if it's a string
                    let result = typeof returnvalue === 'string' ? JSON.parse(returnvalue) : returnvalue;

                    logger.info('📦 Parsed result:', 'JobCompletionListener', {
                        submissionId: result.submissionId,
                        testId: result.testId,
                        status: result.status,
                        hasTestResults: !!(result.testResults && result.testResults.length > 0),
                        totalTestCases: result.totalTestCases,
                        passedTestCases: result.passedTestCases,
                        score: result.score
                    });

                    // Sanitize testId: Ensure it's a string ID, not an object
                    if (result.testId && typeof result.testId === 'object') {
                        logger.warn(`⚠️ Received object for testId in job ${jobId}, extracting _id`, 'JobCompletionListener');
                        result.testId = result.testId._id || result.testId.id || result.testId;
                    }

                    // Ensure testId is a string
                    if (result.testId && typeof result.testId !== 'string') {
                        result.testId = String(result.testId);
                    }

                    // Ensure submissionId exists
                    if (!result.submissionId) {
                        logger.error('❌ No submissionId in result!', 'JobCompletionListener', { jobId, result });
                        return;
                    }

                    logger.info(`💾 Saving result to database for submission ${result.submissionId}`, 'JobCompletionListener');

                    // Save result to database
                    await this.testService.saveSubmissionResult(result);

                    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    logger.info('✅ [JobCompletionListener] SUBMISSION RESULTS SAVED SUCCESSFULLY');
                    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    logger.info(`Submission ID: ${result.submissionId}`);
                    logger.info(`Status: ${result.status || 'completed'}`);
                    logger.info(`Score: ${result.score}%`);
                    logger.info(`Passed: ${result.passedTestCases}/${result.totalTestCases}`);
                    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                } catch (error) {
                    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    logger.error('❌ [JobCompletionListener] FAILED TO SAVE SUBMISSION RESULTS');
                    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    logger.error(`Job ID: ${jobId}`);
                    logger.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    if (error instanceof Error && error.stack) {
                        logger.error(`Stack: ${error.stack}`);
                    }
                    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                }
            });

            // Listen for failed jobs
            this.queueEvents.on('failed', async ({ jobId, failedReason }) => {
                logger.error('Job failed event received', 'JobCompletionListener', {
                    jobId,
                    failedReason
                });

                // Note: We can't get job data from the event, would need to fetch job
                // For now just log the failure
            });

            logger.info('Job completion listener started successfully', 'JobCompletionListener');
        } catch (error) {
            logger.error('Failed to start job completion listener', 'JobCompletionListener', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Stop listening for job completions
     */
    public async stop(): Promise<void> {
        if (this.queueEvents) {
            await this.queueEvents.close();
            this.queueEvents = null;
            logger.info('Job completion listener stopped', 'JobCompletionListener');
        }
    }
}

export const jobCompletionListener = new JobCompletionListener();
