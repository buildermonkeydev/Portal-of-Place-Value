import { RedisClient } from '@repo/redis-lib';
import { MailJobData, NotificationJobData, DataProcessingJobData, CodeSubmissionJobData, CodeSubmissionJobType, QUEUE_NAMES, MailJobType, NotificationJobType, DataProcessingJobType } from '@repo/worker';
import { Queue } from 'bullmq';
import logger from '@repo/logger';

/**
 * Queue client for API to communicate with worker queues
 * Handles job queuing without managing workers
 */
export class QueueClient {
    private redisClient: RedisClient;
    private isInitialized: boolean = false;
    private queues: Map<string, Queue> = new Map();

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }

    /**
     * Initialize queue client
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.debug('Queue client already initialized', 'QueueClient');
            return;
        }

        try {
            if (!this.redisClient.isClientConnected()) {
                await this.redisClient.connect();
            }

            const connection = this.redisClient.getClient();
            if (!connection) {
                throw new Error('Redis client not available');
            }

            // Initialize BullMQ queues
            this.queues.set(QUEUE_NAMES.MAIL, new Queue(QUEUE_NAMES.MAIL, { connection: connection as any }));
            this.queues.set(QUEUE_NAMES.NOTIFICATIONS, new Queue(QUEUE_NAMES.NOTIFICATIONS, { connection: connection as any }));
            this.queues.set(QUEUE_NAMES.DATA_PROCESSING, new Queue(QUEUE_NAMES.DATA_PROCESSING, { connection: connection as any }));
            this.queues.set(QUEUE_NAMES.CODE_SUBMISSIONS, new Queue(QUEUE_NAMES.CODE_SUBMISSIONS, { connection: connection as any }));

            this.isInitialized = true;
            logger.info('Queue client initialized successfully', 'QueueClient');
        } catch (error) {
            logger.error('Failed to initialize queue client', 'QueueClient', { error });
            throw error;
        }
    }

    /**
     * Add mail job to queue
     */
    public async addMailJob(
        type: MailJobType,
        to: string,
        subject: string,
        template: string,
        data: any,
        options?: { delay?: number; priority?: number }
    ): Promise<void> {
        try {
            const queue = this.queues.get(QUEUE_NAMES.MAIL);
            if (!queue) {
                throw new Error('Mail queue not initialized');
            }

            const jobData: MailJobData = {
                type,
                to,
                subject,
                template,
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                },
                createdAt: new Date(),
                metadata: {
                    priority: options?.priority || 0,
                    retryCount: 0,
                    maxRetries: 3,
                    source: 'api'
                }
            };

            // Add job using BullMQ Queue
            await queue.add(type, jobData, {
                delay: options?.delay || 0,
                priority: options?.priority || 0,
                removeOnComplete: 100,
                removeOnFail: 50,
            });

            logger.info('Mail job queued successfully', 'QueueClient', {
                type,
                to: this.sanitizeEmail(to),
                subject,
                template,
            });
        } catch (error) {
            logger.error('Failed to queue mail job', 'QueueClient', {
                type,
                to: this.sanitizeEmail(to),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Add notification job to queue
     */
    public async addNotificationJob(
        type: NotificationJobType,
        userId: string,
        title: string,
        message: string,
        data?: any,
        options?: { delay?: number; priority?: number }
    ): Promise<void> {
        try {
            const connection = this.redisClient.getClient();
            if (!connection) {
                throw new Error('Redis client not available');
            }

            const jobData: NotificationJobData = {
                type,
                userId,
                title,
                message,
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                },
                createdAt: new Date(),
                metadata: {
                    priority: options?.priority || 0,
                    retryCount: 0,
                    maxRetries: 3,
                    source: 'api'
                }
            };

            const queueKey = `bull:${QUEUE_NAMES.NOTIFICATIONS}:waiting`;
            await connection.lpush(queueKey, JSON.stringify({
                name: type,
                data: jobData,
                opts: {
                    delay: options?.delay || 0,
                    priority: options?.priority || 0,
                },
                timestamp: Date.now(),
            }));

            logger.info('Notification job queued successfully', 'QueueClient', {
                type,
                userId,
                title,
            });
        } catch (error) {
            logger.error('Failed to queue notification job', 'QueueClient', {
                type,
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Add data processing job to queue
     */
    public async addDataProcessingJob(
        type: DataProcessingJobType,
        fileId: string,
        options: any,
        jobOptions?: { delay?: number; priority?: number }
    ): Promise<void> {
        try {
            const connection = this.redisClient.getClient();
            if (!connection) {
                throw new Error('Redis client not available');
            }

            const jobData: DataProcessingJobData = {
                type,
                fileId,
                options: {
                    ...options,
                    timestamp: new Date().toISOString(),
                },
                createdAt: new Date(),
                metadata: {
                    priority: jobOptions?.priority || 0,
                    retryCount: 0,
                    maxRetries: 3,
                    source: 'api'
                }
            };

            const queueKey = `bull:${QUEUE_NAMES.DATA_PROCESSING}:waiting`;
            await connection.lpush(queueKey, JSON.stringify({
                name: type,
                data: jobData,
                opts: {
                    delay: jobOptions?.delay || 0,
                    priority: jobOptions?.priority || 0,
                },
                timestamp: Date.now(),
            }));

            logger.info('Data processing job queued successfully', 'QueueClient', {
                type,
                fileId,
            });
        } catch (error) {
            logger.error('Failed to queue data processing job', 'QueueClient', {
                type,
                fileId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Add code submission job to queue
     */
    public async addCodeSubmissionJob(data: {
        submissionId: string;
        testId: string;
        userId: string;
        sourceCode: string;
        languageId: number;
        testData: any; // Test data to avoid database fetch in worker
    }): Promise<string> {
        const { submissionId, testId, userId, sourceCode, languageId, testData } = data;
        try {
            const queue = this.queues.get(QUEUE_NAMES.CODE_SUBMISSIONS);
            if (!queue) {
                throw new Error('Code submissions queue not initialized');
            }

            const jobData: CodeSubmissionJobData = {
                type: CodeSubmissionJobType.TEST_SUBMISSION,
                submissionId,
                testId,
                userId,
                sourceCode,
                languageId,
                testData, // Include test data
                createdAt: new Date(),
                metadata: {
                    priority: 0,
                    retryCount: 0,
                    maxRetries: 2,
                    source: 'api'
                }
            };

            const job = await queue.add(CodeSubmissionJobType.TEST_SUBMISSION, jobData, {
                jobId: submissionId,
                delay: 0,
                priority: 0,
                removeOnComplete: 1000,
                removeOnFail: 100,
            });

            logger.info('Code submission job queued', 'QueueClient', {
                submissionId,
                testId,
                userId,
                jobId: job.id
            });

            return job.id || '';
        } catch (error) {
            logger.error('Failed to queue code submission', 'QueueClient', {
                submissionId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }

    /**
     * Get queue statistics
     */
    public async getQueueStats(queueName: string): Promise<any> {
        try {
            const connection = this.redisClient.getClient();
            if (!connection) {
                throw new Error('Redis client not available');
            }

            const waitingKey = `bull:${queueName}:waiting`;
            const activeKey = `bull:${queueName}:active`;
            const completedKey = `bull:${queueName}:completed`;
            const failedKey = `bull:${queueName}:failed`;
            const delayedKey = `bull:${queueName}:delayed`;

            const [waiting, active, completed, failed, delayed] = await Promise.all([
                connection.llen(waitingKey),
                connection.llen(activeKey),
                connection.llen(completedKey),
                connection.llen(failedKey),
                connection.llen(delayedKey),
            ]);

            return {
                waiting: waiting || 0,
                active: active || 0,
                completed: completed || 0,
                failed: failed || 0,
                delayed: delayed || 0,
            };
        } catch (error) {
            logger.error(`Failed to get queue stats: ${queueName}`, 'QueueClient', { error });
            return {
                waiting: 0,
                active: 0,
                completed: 0,
                failed: 0,
                delayed: 0,
            };
        }
    }

    /**
     * Check if queue client is ready
     */
    public isReady(): boolean {
        return this.isInitialized && this.redisClient.isClientConnected();
    }

    /**
     * Close queue client
     */
    public async close(): Promise<void> {
        try {
            // Close all queues
            const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
            await Promise.all(closePromises);

            this.queues.clear();
            this.isInitialized = false;
            logger.info('Queue client closed', 'QueueClient');
        } catch (error) {
            logger.error('Failed to close queue client', 'QueueClient', { error });
            throw error;
        }
    }

    /**
     * Sanitize email for logging
     */
    private sanitizeEmail(email: string): string {
        const [localPart, domain] = email.split('@');
        return `${localPart.substring(0, 2)}***@${domain}`;
    }
}
