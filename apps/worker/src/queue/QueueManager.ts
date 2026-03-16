import { Queue, Worker, Job, QueueEvents, QueueOptions, WorkerOptions } from 'bullmq';
import { RedisClient } from '@repo/redis-lib';
import { MailJobData, NotificationJobData, DataProcessingJobData, QueueStats, QUEUE_NAMES } from '../types/queue.types';
import logger from '@repo/logger';

/**
 * Production-grade queue manager for the worker application
 * Handles job queuing, processing, and monitoring
 */
export class QueueManager {
    private redisClient: RedisClient;
    private queues: Map<string, Queue> = new Map();
    private workers: Map<string, Worker> = new Map();
    private queueEvents: Map<string, QueueEvents> = new Map();
    private isInitialized: boolean = false;

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }

    /**
     * Initialize queue manager
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.info('Queue manager already initialized', 'QueueManager');
            return;
        }

        try {
            logger.info('Initializing queue manager...', 'QueueManager');

            // Create default queues
            await this.createQueue(QUEUE_NAMES.MAIL, {
                name: QUEUE_NAMES.MAIL,
                concurrency: 5,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: 100,
                removeOnFail: 50,
            });

            await this.createQueue(QUEUE_NAMES.NOTIFICATIONS, {
                name: QUEUE_NAMES.NOTIFICATIONS,
                concurrency: 10,
                attempts: 2,
                removeOnComplete: 50,
                removeOnFail: 25,
            });

            await this.createQueue(QUEUE_NAMES.DATA_PROCESSING, {
                name: QUEUE_NAMES.DATA_PROCESSING,
                concurrency: 3,
                attempts: 5,
                backoff: {
                    type: 'fixed',
                    delay: 5000,
                },
                removeOnComplete: 20,
                removeOnFail: 10,
            });

            this.isInitialized = true;
            logger.info('Queue manager initialized successfully', 'QueueManager');
        } catch (error) {
            logger.error('Failed to initialize queue manager', 'QueueManager', { error });
            throw error;
        }
    }

    /**
     * Create a new queue
     */
    public async createQueue(name: string, config: any): Promise<Queue> {
        if (this.queues.has(name)) {
            logger.warn(`Queue ${name} already exists`, 'QueueManager');
            return this.queues.get(name)!;
        }

        try {
            const connection = this.redisClient.getClient();
            if (!connection) {
                throw new Error('Redis client not available');
            }

            const queueOptions: QueueOptions = {
                connection: connection as any,
                defaultJobOptions: {
                    removeOnComplete: config.removeOnComplete || 100,
                    removeOnFail: config.removeOnFail || 50,
                    attempts: config.attempts || 3,
                    backoff: config.backoff || {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            };

            const queue = new Queue(name, queueOptions);
            const queueEvents = new QueueEvents(name, { connection: connection as any });

            // Set up event listeners
            this.setupQueueEventListeners(queue, queueEvents);

            this.queues.set(name, queue);
            this.queueEvents.set(name, queueEvents);

            logger.info(`Queue created: ${name}`, 'QueueManager', { config });
            return queue;
        } catch (error) {
            logger.error(`Failed to create queue: ${name}`, 'QueueManager', { error });
            throw error;
        }
    }

    /**
     * Add job to queue
     */
    public async addJob<T extends MailJobData | NotificationJobData | DataProcessingJobData>(
        queueName: string,
        jobName: string,
        data: T,
        options?: {
            delay?: number;
            priority?: number;
            jobId?: string;
        }
    ): Promise<Job<T>> {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }

        try {
            const job = await queue.add(jobName, data, {
                delay: options?.delay,
                priority: options?.priority,
                jobId: options?.jobId,
            });

            logger.info(`Job added to queue: ${queueName}`, 'QueueManager', {
                jobId: job.id,
                jobName,
                data: this.sanitizeJobData(data),
            });

            return job;
        } catch (error) {
            logger.error(`Failed to add job to queue: ${queueName}`, 'QueueManager', { error });
            throw error;
        }
    }

    /**
     * Add mail job
     */
    public async addMailJob(
        type: 'register' | 'forgot-password' | 'reset-password' | 'welcome',
        to: string,
        subject: string,
        template: string,
        data: any,
        options?: { delay?: number; priority?: number }
    ): Promise<Job<MailJobData>> {
        return this.addJob(QUEUE_NAMES.MAIL, type, {
            type,
            to,
            subject,
            template,
            data,
        } as MailJobData, options);
    }

    /**
     * Add notification job
     */
    public async addNotificationJob(
        type: 'push' | 'sms' | 'in-app',
        userId: string,
        title: string,
        message: string,
        data?: any,
        options?: { delay?: number; priority?: number }
    ): Promise<Job<NotificationJobData>> {
        return this.addJob(QUEUE_NAMES.NOTIFICATIONS, type, {
            type,
            userId,
            title,
            message,
            data,
        } as NotificationJobData, options);
    }

    /**
     * Add data processing job
     */
    public async addDataProcessingJob(
        type: 'image-resize' | 'pdf-generate' | 'data-export',
        fileId: string,
        options: any,
        jobOptions?: { delay?: number; priority?: number }
    ): Promise<Job<DataProcessingJobData>> {
        return this.addJob(QUEUE_NAMES.DATA_PROCESSING, type, {
            type,
            fileId,
            options,
        } as DataProcessingJobData, jobOptions);
    }

    /**
     * Get queue statistics
     */
    public async getQueueStats(queueName: string): Promise<QueueStats> {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }

        try {
            const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
                queue.getWaiting(),
                queue.getActive(),
                queue.getCompleted(),
                queue.getFailed(),
                queue.getDelayed(),
                queue.isPaused(),
            ]);

            return {
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length,
                delayed: delayed.length,
                paused: isPaused,
            };
        } catch (error) {
            logger.error(`Failed to get queue stats: ${queueName}`, 'QueueManager', { error });
            throw error;
        }
    }

    /**
     * Get all queues statistics
     */
    public async getAllQueuesStats(): Promise<Record<string, QueueStats>> {
        const stats: Record<string, QueueStats> = {};

        for (const [name] of this.queues) {
            try {
                stats[name] = await this.getQueueStats(name);
            } catch (error) {
                logger.error(`Failed to get stats for queue: ${name}`, 'QueueManager', { error });
                stats[name] = {
                    waiting: 0,
                    active: 0,
                    completed: 0,
                    failed: 0,
                    delayed: 0,
                    paused: false,
                };
            }
        }

        return stats;
    }

    /**
     * Pause queue
     */
    public async pauseQueue(queueName: string): Promise<void> {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }

        await queue.pause();
        logger.info(`Queue paused: ${queueName}`, 'QueueManager');
    }

    /**
     * Resume queue
     */
    public async resumeQueue(queueName: string): Promise<void> {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }

        await queue.resume();
        logger.info(`Queue resumed: ${queueName}`, 'QueueManager');
    }

    /**
     * Clean queue
     */
    public async cleanQueue(queueName: string, grace: number = 0): Promise<void> {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }

        await queue.clean(grace, 100, 'completed');
        await queue.clean(grace, 100, 'failed');
        logger.info(`Queue cleaned: ${queueName}`, 'QueueManager');
    }

    /**
     * Get queue instance
     */
    public getQueue(queueName: string): Queue | undefined {
        return this.queues.get(queueName);
    }

    /**
     * Close all queues and workers
     */
    public async close(): Promise<void> {
        try {
            logger.info('Closing queue manager...', 'QueueManager');

            // Close all workers
            for (const [name, worker] of this.workers) {
                await worker.close();
                logger.info(`Worker closed: ${name}`, 'QueueManager');
            }

            // Close all queues
            for (const [name, queue] of this.queues) {
                await queue.close();
                logger.info(`Queue closed: ${name}`, 'QueueManager');
            }

            // Close all queue events
            for (const [name, events] of this.queueEvents) {
                await events.close();
                logger.info(`Queue events closed: ${name}`, 'QueueManager');
            }

            this.queues.clear();
            this.workers.clear();
            this.queueEvents.clear();
            this.isInitialized = false;

            logger.info('Queue manager closed successfully', 'QueueManager');
        } catch (error) {
            logger.error('Failed to close queue manager', 'QueueManager', { error });
            throw error;
        }
    }

    /**
     * Setup queue event listeners
     */
    private setupQueueEventListeners(queue: Queue, queueEvents: QueueEvents): void {
        queueEvents.on('waiting', ({ jobId }) => {
            logger.debug(`Job waiting: ${jobId}`, 'QueueManager', { queueName: queue.name });
        });

        queueEvents.on('active', ({ jobId }) => {
            logger.debug(`Job active: ${jobId}`, 'QueueManager', { queueName: queue.name });
        });

        queueEvents.on('completed', ({ jobId, returnvalue }) => {
            logger.info(`Job completed: ${jobId}`, 'QueueManager', {
                queueName: queue.name,
                returnValue: returnvalue,
            });
        });

        queueEvents.on('failed', ({ jobId, failedReason }) => {
            logger.error(`Job failed: ${jobId}`, 'QueueManager', {
                queueName: queue.name,
                failedReason,
            });
        });

        queueEvents.on('stalled', ({ jobId }) => {
            logger.warn(`Job stalled: ${jobId}`, 'QueueManager', { queueName: queue.name });
        });
    }

    /**
     * Sanitize job data for logging
     */
    private sanitizeJobData(data: any): any {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        const sanitized = { ...data };

        // Remove sensitive fields
        const sensitiveFields = ['password', 'token', 'secret', 'key', 'link', 'verificationLink', 'resetLink'];
        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        }

        // Sanitize nested data object
        if (sanitized.data && typeof sanitized.data === 'object') {
            for (const field of sensitiveFields) {
                if (field in sanitized.data) {
                    sanitized.data[field] = '[REDACTED]';
                }
            }
        }

        return sanitized;
    }
}
