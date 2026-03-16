import { RedisLibrary, CacheManager, SessionManager, RedisLibraryConfig } from '@repo/redis-lib';
import { QueueClient } from './QueueClient';
import logger from '@repo/logger';

/**
 * Production-grade Redis service manager
 * Handles Redis connection lifecycle, health monitoring, and graceful shutdowns
 */
export class RedisService {
    private static instance: RedisService;
    private redisLibrary: RedisLibrary;
    private queueClient: QueueClient;
    private isInitialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private readonly HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds

    private constructor() {
        this.redisLibrary = RedisLibrary.fromEnvironment();
        this.queueClient = new QueueClient(this.redisLibrary.getRedisClient());

    }

    /**
     * Singleton pattern implementation with thread-safe initialization
     */
    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    /**
     * Initialize Redis service with retry logic and health monitoring
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.debug('Redis service already initialized', 'RedisService');
            return;
        }

        if (this.initializationPromise) {
            logger.debug('Redis service initialization in progress', 'RedisService');
            return this.initializationPromise;
        }

        this.initializationPromise = this.performInitialization();

        try {
            await this.initializationPromise;
        } finally {
            this.initializationPromise = null;
        }
    }

    private async performInitialization(): Promise<void> {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                logger.info('Initializing Redis service...', 'RedisService', {
                    attempt: retryCount + 1,
                    maxRetries
                });

                await this.redisLibrary.initialize();
                await this.queueClient.initialize();

                this.isInitialized = true;
                this.startHealthMonitoring();

                logger.info('Redis service initialized successfully', 'RedisService', {
                    ready: this.redisLibrary.isReady()
                });

                return;
            } catch (error) {
                retryCount++;
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff

                logger.error('Redis service initialization failed', 'RedisService', {
                    attempt: retryCount,
                    maxRetries,
                    delay,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });

                if (retryCount >= maxRetries) {
                    throw new Error(`Redis service initialization failed after ${maxRetries} attempts: ${error}`);
                }

                await this.delay(delay);
            }
        }
    }

    /**
     * Graceful shutdown with cleanup
     */
    public async shutdown(): Promise<void> {
        try {
            logger.info('Initiating Redis service shutdown...', 'RedisService');

            this.stopHealthMonitoring();

            if (this.isInitialized) {
                await this.queueClient.close();
                await this.redisLibrary.close();
                this.isInitialized = false;
            }

            logger.info('Redis service shutdown completed', 'RedisService');
        } catch (error) {
            logger.error('Redis service shutdown failed', 'RedisService', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    /**
     * Get cache manager with null safety
     */
    public getCacheManager(): CacheManager {
        this.ensureInitialized();
        return this.redisLibrary.getCacheManager();
    }

    /**
     * Get Redis client instance
     */
    public getRedisClient(): any {
        this.ensureInitialized();
        return this.redisLibrary.getRedisClient().getClient();
    }


    /**
     * Get session manager with null safety
     */
    public getSessionManager(): SessionManager {
        this.ensureInitialized();
        return this.redisLibrary.getSessionManager();
    }

    /**
     * Get queue client for job queuing
     */
    public getQueueClient(): QueueClient {
        this.ensureInitialized();
        return this.queueClient;
    }

    /**
     * Get Redis configuration for connection setup
     * Returns the RedisLibraryConfig which includes redis connection details
     */
    public getConfig(): RedisLibraryConfig {
        this.ensureInitialized();
        return this.redisLibrary.getConfig();
    }

    /**
     * Check if Redis service is ready for operations
     */
    public isReady(): boolean {
        return this.isInitialized && this.redisLibrary.isReady();
    }

    /**
     * Comprehensive health check with detailed diagnostics
     */
    public async healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy' | 'degraded';
        timestamp: string;
        details: {
            initialized: boolean;
            ready: boolean;
            redis: any;
            uptime: number;
        };
    }> {
        const startTime = Date.now();

        try {
            if (!this.isInitialized) {
                return {
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    details: {
                        initialized: false,
                        ready: false,
                        redis: { error: 'Service not initialized' },
                        uptime: 0
                    }
                };
            }

            const redisHealth = await this.redisLibrary.healthCheck();
            const isReady = this.redisLibrary.isReady();

            const status = isReady ? 'healthy' : 'degraded';

            return {
                status,
                timestamp: new Date().toISOString(),
                details: {
                    initialized: this.isInitialized,
                    ready: isReady,
                    redis: redisHealth,
                    uptime: Date.now() - startTime
                }
            };
        } catch (error) {
            logger.error('Redis health check failed', 'RedisService', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                details: {
                    initialized: this.isInitialized,
                    ready: false,
                    redis: { error: error instanceof Error ? error.message : 'Unknown error' },
                    uptime: Date.now() - startTime
                }
            };
        }
    }

    /**
     * Get comprehensive service statistics
     */
    public async getStats(): Promise<any> {
        this.ensureInitialized();
        return await this.redisLibrary.getStats();
    }

    /**
     * Acquire a distributed lock with automatic expiration
     * Returns a lock token that must be used to release the lock
     * @param lockKey - Unique key for the lock
     * @param ttlSeconds - Time-to-live for the lock in seconds (default: 30s)
     * @param retryAttempts - Number of times to retry acquiring the lock (default: 5)
     * @param retryDelayMs - Delay between retry attempts in milliseconds (default: 100ms)
     */
    public async acquireLock(
        lockKey: string,
        ttlSeconds: number = 30,
        retryAttempts: number = 5,
        retryDelayMs: number = 100
    ): Promise<string | null> {
        this.ensureInitialized();
        const client = this.getRedisClient();
        const lockValue = `${Date.now()}-${Math.random()}`; // Unique lock token

        for (let attempt = 0; attempt < retryAttempts; attempt++) {
            try {
                // Use SET with NX (only if not exists) and EX (expiration)
                const result = await client.set(
                    `lock:${lockKey}`,
                    lockValue,
                    'NX', // Only set if not exists
                    'EX', // Set expiration
                    ttlSeconds
                );

                if (result === 'OK') {
                    logger.debug('Lock acquired successfully', 'RedisService', {
                        lockKey,
                        lockValue,
                        ttl: ttlSeconds,
                        attempt: attempt + 1
                    });
                    return lockValue; // Successfully acquired lock
                }

                // Lock is held by someone else, wait and retry
                if (attempt < retryAttempts - 1) {
                    await this.delay(retryDelayMs);
                }
            } catch (error) {
                logger.error('Error acquiring lock', 'RedisService', {
                    lockKey,
                    attempt: attempt + 1,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                throw error;
            }
        }

        logger.warn('Failed to acquire lock after retries', 'RedisService', {
            lockKey,
            retryAttempts
        });
        return null; // Failed to acquire lock
    }

    /**
     * Release a distributed lock using the lock token
     * @param lockKey - Unique key for the lock
     * @param lockValue - The lock token received from acquireLock
     */
    public async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
        this.ensureInitialized();
        const client = this.getRedisClient();

        try {
            // Use Lua script to ensure atomic check-and-delete
            // Only delete if the lock value matches (prevent releasing someone else's lock)
            const script = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            `;

            const result = await client.eval(script, 1, `lock:${lockKey}`, lockValue);

            if (result === 1) {
                logger.debug('Lock released successfully', 'RedisService', {
                    lockKey,
                    lockValue
                });
                return true;
            } else {
                logger.warn('Lock not released - value mismatch or already expired', 'RedisService', {
                    lockKey
                });
                return false;
            }
        } catch (error) {
            logger.error('Error releasing lock', 'RedisService', {
                lockKey,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }

    /**
     * Execute a function with a distributed lock
     * Automatically handles lock acquisition and release
     * @param lockKey - Unique key for the lock
     * @param fn - Function to execute while holding the lock
     * @param ttlSeconds - Time-to-live for the lock in seconds
     */
    public async withLock<T>(
        lockKey: string,
        fn: () => Promise<T>,
        ttlSeconds: number = 30
    ): Promise<T> {
        const lockValue = await this.acquireLock(lockKey, ttlSeconds);

        if (!lockValue) {
            throw new Error(`Failed to acquire lock for key: ${lockKey}`);
        }

        try {
            // Execute the function while holding the lock
            return await fn();
        } finally {
            // Always release the lock, even if function throws
            await this.releaseLock(lockKey, lockValue);
        }
    }


    /**
     * Start periodic health monitoring
     */
    private startHealthMonitoring(): void {
        if (this.healthCheckInterval) {
            return;
        }

        this.healthCheckInterval = setInterval(async () => {
            try {
                const health = await this.healthCheck();
                if (health.status === 'unhealthy') {
                    logger.warn('Redis health check detected unhealthy status', 'RedisService', health);
                }
            } catch (error) {
                logger.error('Health monitoring check failed', 'RedisService', {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }, this.HEALTH_CHECK_INTERVAL_MS);

        logger.debug('Redis health monitoring started', 'RedisService', {
            interval: this.HEALTH_CHECK_INTERVAL_MS
        });
    }

    /**
     * Stop health monitoring
     */
    private stopHealthMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            logger.debug('Redis health monitoring stopped', 'RedisService');
        }
    }

    /**
     * Ensure service is initialized before operations
     */
    private ensureInitialized(): void {
        if (!this.isInitialized) {
            throw new Error('Redis service not initialized. Call initialize() first.');
        }
    }

    /**
     * Utility method for delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Singleton instance for dependency injection
 */
export const redisService = RedisService.getInstance();
