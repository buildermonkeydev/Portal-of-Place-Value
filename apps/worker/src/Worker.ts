import { Worker, WorkerOptions } from "bullmq";
import { RedisClient } from '@repo/redis-lib';
import { MailJobData, NotificationJobData, DataProcessingJobData, CodeSubmissionJobData, QUEUE_NAMES } from './types/queue.types';
import { MailProcessor } from './processors/MailProcessor';
import { CodeSubmissionProcessor } from './processors/CodeSubmissionProcessor';
import { MailService } from './services/MailService';
import logger from '@repo/logger';
import { getConfig } from '@repo/env-config';

export class WorkerApp {
    private redisClient: RedisClient;
    private workers: Map<string, Worker> = new Map();
    private mailProcessor: MailProcessor;
    private codeSubmissionProcessor: CodeSubmissionProcessor;
    private isRunning: boolean = false;
    private config: ReturnType<typeof getConfig>;

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;

        this.config = getConfig();
        const smtpConfig = this.config.getSMTP();

        const mailConfig = {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass,
            },
            from: smtpConfig.from,
        };

        const mailService = new MailService(mailConfig);
        this.mailProcessor = new MailProcessor(mailService);
        this.codeSubmissionProcessor = new CodeSubmissionProcessor();
    }

    /**
     * Start all workers
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Worker app is already running', 'WorkerApp');
            return;
        }

        try {
            logger.info('Starting worker application...', 'WorkerApp');

            // Verify Redis connection
            if (!this.redisClient.isClientConnected()) {
                await this.redisClient.connect();
            }

            // Start mail worker
            await this.startMailWorker();

            // Start notification worker
            await this.startNotificationWorker();

            // Start data processing worker
            await this.startDataProcessingWorker();

            // Start code submission worker
            await this.startCodeSubmissionWorker();

            this.isRunning = true;
            logger.info('Worker application started successfully', 'WorkerApp');

            // Set up graceful shutdown
            this.setupGracefulShutdown();
        } catch (error) {
            logger.error('Failed to start worker application', 'WorkerApp', { error });
            throw error;
        }
    }

    private async startMailWorker(): Promise<void> {
        const connection = this.redisClient.getClient();
        if (!connection) {
            throw new Error('Redis client not available');
        }

        const workerOptions: WorkerOptions = {
            connection: connection as any,
            concurrency: this.config.getWorker().mailConcurrency,
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
        };

        const worker = new Worker<MailJobData>(
            QUEUE_NAMES.MAIL,
            async (job) => {
                const { type } = job.data;

                await this.mailProcessor.processMailJob(job);
            },
            workerOptions
        );

        // Set up worker event listeners
        this.setupWorkerEventListeners(worker, 'MailWorker');

        this.workers.set(QUEUE_NAMES.MAIL, worker);
        logger.info('Mail worker started', 'WorkerApp', { concurrency: workerOptions.concurrency });
    }

    /**
     * Start notification worker
     */
    private async startNotificationWorker(): Promise<void> {
        const connection = this.redisClient.getClient();
        if (!connection) {
            throw new Error('Redis client not available');
        }

        const workerOptions: WorkerOptions = {
            connection: connection as any,
            concurrency: this.config.getWorker().notificationConcurrency,
            removeOnComplete: { count: 50 },
            removeOnFail: { count: 25 },
        };

        const worker = new Worker<NotificationJobData>(
            QUEUE_NAMES.NOTIFICATIONS,
            async (job) => {
                const { type, userId, title, message, data } = job.data;

                logger.info(`Processing notification: ${type}`, 'NotificationWorker', {
                    jobId: job.id,
                    userId,
                    title,
                });

                // TODO: Implement notification logic
                // This could include push notifications, SMS, in-app notifications, etc.

                switch (type) {
                    case 'push':
                        // Implement push notification logic
                        logger.info('Push notification sent', 'NotificationWorker', { userId, title });
                        break;
                    case 'sms':
                        // Implement SMS logic
                        logger.info('SMS sent', 'NotificationWorker', { userId, message });
                        break;
                    case 'in-app':
                        // Implement in-app notification logic
                        logger.info('In-app notification sent', 'NotificationWorker', { userId, title });
                        break;
                    default:
                        logger.warn(`Unknown notification type: ${type}`, 'NotificationWorker');
                }
            },
            workerOptions
        );

        this.setupWorkerEventListeners(worker, 'NotificationWorker');
        this.workers.set(QUEUE_NAMES.NOTIFICATIONS, worker);
        logger.info('Notification worker started', 'WorkerApp', { concurrency: workerOptions.concurrency });
    }

    /**
     * Start data processing worker
     */
    private async startDataProcessingWorker(): Promise<void> {
        const connection = this.redisClient.getClient();
        if (!connection) {
            throw new Error('Redis client not available');
        }

        const workerOptions: WorkerOptions = {
            connection: connection as any,
            concurrency: this.config.getWorker().dataProcessingConcurrency,
            removeOnComplete: { count: 20 },
            removeOnFail: { count: 10 },
        };

        const worker = new Worker<DataProcessingJobData>(
            QUEUE_NAMES.DATA_PROCESSING,
            async (job) => {
                const { type, fileId, options } = job.data;

                logger.info(`Processing data job: ${type}`, 'DataProcessingWorker', {
                    jobId: job.id,
                    fileId,
                });

                // TODO: Implement data processing logic
                // This could include image resizing, PDF generation, data export, etc.

                switch (type) {
                    case 'image-resize':
                        // Implement image resizing logic
                        logger.info('Image resized', 'DataProcessingWorker', { fileId });
                        break;
                    case 'pdf-generate':
                        // Implement PDF generation logic
                        logger.info('PDF generated', 'DataProcessingWorker', { fileId });
                        break;
                    case 'data-export':
                        // Implement data export logic
                        logger.info('Data exported', 'DataProcessingWorker', { fileId });
                        break;
                    default:
                        logger.warn(`Unknown data processing type: ${type}`, 'DataProcessingWorker');
                }
            },
            workerOptions
        );

        this.setupWorkerEventListeners(worker, 'DataProcessingWorker');
        this.workers.set(QUEUE_NAMES.DATA_PROCESSING, worker);
        this.workers.set(QUEUE_NAMES.DATA_PROCESSING, worker);
        logger.info('Data processing worker started', 'WorkerApp', { concurrency: workerOptions.concurrency });
    }

    /**
     * Start code submission worker
     */
    private async startCodeSubmissionWorker(): Promise<void> {
        const connection = this.redisClient.getClient();
        if (!connection) {
            throw new Error('Redis client not available');
        }

        const workerOptions: WorkerOptions = {
            connection: connection as any,
            concurrency: 50, // High concurrency for code submissions

            // === JOB TIMEOUT CONFIGURATION (PREVENTS RESOURCE LEAKS) ===
            lockDuration: 60000,      // Maximum 60s per job (Judge0 can take 30-45s)
            lockRenewTime: 15000,     // Renew lock every 15s if still processing
            stalledInterval: 30000,   // Check for stalled jobs every 30s
            maxStalledCount: 2,       // Fail job after 2 stalls (2 min total)

            // Job cleanup
            removeOnComplete: { count: 1000 },
            removeOnFail: { count: 100 },

            // Rate limiting
            limiter: {
                max: 100,
                duration: 1000,
            },
        };

        const worker = new Worker<CodeSubmissionJobData>(
            QUEUE_NAMES.CODE_SUBMISSIONS,
            async (job) => {
                return this.codeSubmissionProcessor.processJob(job);
            },
            workerOptions
        );

        // Set up worker event listeners
        this.setupWorkerEventListeners(worker, 'CodeSubmissionWorker');

        this.workers.set(QUEUE_NAMES.CODE_SUBMISSIONS, worker);
        logger.info('Code submission worker started', 'WorkerApp', {
            concurrency: workerOptions.concurrency,
            lockDuration: workerOptions.lockDuration,
            stalledInterval: workerOptions.stalledInterval
        });
    }

    /**
     * Set up worker event listeners
     */
    private setupWorkerEventListeners(worker: Worker, workerName: string): void {
        worker.on('ready', () => {
            logger.info(`${workerName} is ready`, 'WorkerApp');
        });

        worker.on('active', (job) => {
            logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            logger.info(`  ${workerName} job ACTIVE: ${job.id}`);
            logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        });

        worker.on('completed', (job) => {
            logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            logger.info(` ${workerName} job COMPLETED: ${job.id}`);
            logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        });

        worker.on('failed', (job, err) => {
            logger.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            logger.error(` ${workerName} job FAILED: ${job?.id}`);
            logger.error(`Error: ${err.message}`);
            logger.error(`Stack: ${err.stack}`);
            logger.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        });

        worker.on('stalled', (jobId) => {
            logger.warn(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            logger.warn(`  ${workerName} job STALLED: ${jobId}`);
            logger.warn(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        });

        worker.on('error', (err) => {
            logger.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            logger.error(` ${workerName} ERROR: ${err.message}`);
            logger.error(`Stack: ${err.stack}`);
            logger.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        });
    }

    /**
     * Set up graceful shutdown
     */
    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}, shutting down gracefully...`, 'WorkerApp');
            await this.stop();
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    /**
     * Stop all workers
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.warn('Worker app is not running', 'WorkerApp');
            return;
        }

        try {
            logger.info('Stopping worker application...', 'WorkerApp');

            // Close all workers
            const closePromises = Array.from(this.workers.entries()).map(async ([name, worker]) => {
                await worker.close();
                logger.info(`Worker stopped: ${name}`, 'WorkerApp');
            });

            await Promise.all(closePromises);

            this.workers.clear();
            this.isRunning = false;

            logger.info('Worker application stopped successfully', 'WorkerApp');
        } catch (error) {
            logger.error('Failed to stop worker application', 'WorkerApp', { error });
            throw error;
        }
    }

    /**
     * Get worker status
     */
    public getStatus(): { isRunning: boolean; workers: string[] } {
        return {
            isRunning: this.isRunning,
            workers: Array.from(this.workers.keys()),
        };
    }
}
