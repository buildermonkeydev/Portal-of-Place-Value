import { RedisClient, RedisConfig } from './client';
import { CacheManager, CacheOptions } from './cache';
import { SessionManager, SessionOptions } from './session';
import { PubSubManager } from './pubsub';
import logger from '@repo/logger';
import Config from '@repo/env-config';

export interface RedisLibraryConfig {
    redis: RedisConfig;
    cache?: CacheOptions;
    session?: SessionOptions;
}

export interface RedisLibraryStats {
    redis: any;
    cache: any;
    session: any;
    pubsub: any;
}
const envConfig = Config.getInstance();

export class RedisLibrary {
    private redisClient: RedisClient;
    private cacheManager: CacheManager;
    private sessionManager: SessionManager;
    private pubSubManager: PubSubManager;
    private config: RedisLibraryConfig;
    private isInitialized: boolean = false;

    constructor(config: RedisLibraryConfig) {
        this.config = config;

        // Initialize Redis client
        this.redisClient = new RedisClient(config.redis);

        // Initialize managers
        this.cacheManager = new CacheManager(this.redisClient, config.cache);
        this.sessionManager = new SessionManager(this.redisClient, config.session);
        this.pubSubManager = new PubSubManager(this.redisClient);
    }

    /**
     * Create RedisLibrary instance with environment variables
     */
    public static fromEnvironment(overrides: Partial<RedisLibraryConfig> = {}): RedisLibrary {
        // Parse Redis URL if provided
        let redisConfig: RedisConfig = {};

        // Check if REDIS_URL is provided
        const redisUrl = envConfig.getRedis().url;
        console.log("REDIS_URL", redisUrl);
        if (redisUrl) {
            try {
                const url = new URL(redisUrl);
                redisConfig = {
                    host: url.hostname,
                    port: parseInt(url.port) || 6379,
                    password: url.password || undefined,
                    db: url.pathname ? parseInt(url.pathname.slice(1)) : 0,
                    retryDelayOnFailover: 50,
                    maxRetriesPerRequest: null, // Reduce retries to save connections
                    lazyConnect: true,
                    keepAlive: 60000, // Longer keepalive
                    family: 4,
                    connectTimeout: 10000, // Shorter timeout
                    commandTimeout: 10000, // Shorter timeout
                    enableOfflineQueue: true, // Enable offline queue
                    maxLoadingTimeout: 2000, // Shorter loading timeout
                    enableReadyCheck: false, // Disable to reduce connections
                    maxMemoryPolicy: 'allkeys-lru',
                    maxmemory: '2gb',
                };
            } catch (error) {
                logger.warn('Invalid REDIS_URL format, using individual env vars', 'RedisLibrary', { redisUrl });
                // Fallback to individual env vars
                redisConfig = {
                    host: envConfig.getRedis().host,
                    port: envConfig.getRedis().port,
                    password: envConfig.getRedis().password,
                    db: envConfig.getRedis().db,
                    retryDelayOnFailover: 50,
                    maxRetriesPerRequest: null, // Reduce retries to save connections
                    lazyConnect: true,
                    keepAlive: 60000, // Longer keepalive
                    family: 4,
                    connectTimeout: 10000, // Shorter timeout
                    commandTimeout: 10000, // Shorter timeout
                    enableOfflineQueue: true, // Enable offline queue
                    maxLoadingTimeout: 2000, // Shorter loading timeout
                    enableReadyCheck: false, // Disable to reduce connections
                    maxMemoryPolicy: 'allkeys-lru',
                    maxmemory: '2gb',
                };
            }
        } else {
            // Use individual environment variables
            redisConfig = {
                host: envConfig.getRedis().host,
                port: envConfig.getRedis().port,
                password: envConfig.getRedis().password,
                db: envConfig.getRedis().db,
                retryDelayOnFailover: 50,
                maxRetriesPerRequest: null, // Reduce retries to save connections
                lazyConnect: true,
                keepAlive: 60000, // Longer keepalive
                family: 4,
                connectTimeout: 10000, // Shorter timeout
                commandTimeout: 10000, // Shorter timeout
                enableOfflineQueue: true, // Enable offline queue
                maxLoadingTimeout: 2000, // Shorter loading timeout
                enableReadyCheck: false, // Disable to reduce connections
                // Add connection pooling for high concurrency
                maxMemoryPolicy: 'allkeys-lru',
                maxmemory: '2gb',
                // Additional Redis config for high concurrency
            };
        }

        const config: RedisLibraryConfig = {
            redis: redisConfig,
            cache: {
                ttl: envConfig.getRedis().ttl,
                prefix: envConfig.getRedis().prefix,
            },
            session: {
                ttl: envConfig.getRedis().sessionTtl,
                maxSessionsPerUser: envConfig.getRedis().maxSessionsPerUser,
                prefix: envConfig.getRedis().sessionPrefix,
            },
            ...overrides
        };

        return new RedisLibrary(config);
    }

    /**
     * Initialize the Redis library
     */
    public async initialize(): Promise<void> {
        try {
            logger.info('Initializing Redis library...', 'RedisLibrary');

            await this.redisClient.connect();
            await this.pubSubManager.initialize();

            this.isInitialized = true;
            logger.info('Redis library initialized successfully', 'RedisLibrary');
        } catch (error) {
            logger.error('Failed to initialize Redis library', 'RedisLibrary', { error });
            throw error;
        }
    }

    /**
     * Close all connections
     */
    public async close(): Promise<void> {
        try {
            logger.info('Closing Redis library...', 'RedisLibrary');

            await this.pubSubManager.close();
            await this.redisClient.disconnect();

            this.isInitialized = false;
            logger.info('Redis library closed successfully', 'RedisLibrary');
        } catch (error) {
            logger.error('Failed to close Redis library', 'RedisLibrary', { error });
            throw error;
        }
    }

    /**
     * Check if library is initialized
     */
    public isReady(): boolean {
        return this.isInitialized && this.redisClient.isClientConnected();
    }

    /**
     * Get Redis client
     */
    public getRedisClient(): RedisClient {
        return this.redisClient;
    }

    /**
     * Get cache manager
     */
    public getCacheManager(): CacheManager {
        return this.cacheManager;
    }

    /**
     * Get session manager
     */
    public getSessionManager(): SessionManager {
        return this.sessionManager;
    }

    /**
     * Get pub/sub manager
     */
    public getPubSubManager(): PubSubManager {
        return this.pubSubManager;
    }

    /**
     * Get Redis library configuration
     */
    public getConfig(): RedisLibraryConfig {
        return this.config;
    }

    public async getStats(): Promise<RedisLibraryStats> {
        try {
            const [redisStats, cacheStats, sessionStats, pubsubStats] = await Promise.all([
                this.redisClient.getStats(),
                Promise.resolve(this.cacheManager.getStats()),
                this.sessionManager.getStats(),
                Promise.resolve(this.pubSubManager.getStats())
            ]);

            return {
                redis: redisStats,
                cache: cacheStats,
                session: sessionStats,
                pubsub: pubsubStats
            };
        } catch (error) {
            logger.error('Failed to get Redis library stats', 'RedisLibrary', { error });
            throw error;
        }
    }

    /**
     * Health check
     */
    public async healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: {
            redis: boolean;
            cache: boolean;
            session: boolean;
            pubsub: boolean;
        };
        timestamp: string;
    }> {
        try {
            const details = {
                redis: this.redisClient.isClientConnected(),
                cache: this.isInitialized,
                session: this.isInitialized,
                pubsub: this.isInitialized
            };

            const status = Object.values(details).every(Boolean) ? 'healthy' : 'unhealthy';

            return {
                status,
                details,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Health check failed', 'RedisLibrary', { error });
            return {
                status: 'unhealthy',
                details: {
                    redis: false,
                    cache: false,
                    session: false,
                    pubsub: false
                },
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Cleanup expired data
     */
    public async cleanup(): Promise<{
        sessions: number;
    }> {
        try {
            logger.info('Starting Redis library cleanup...', 'RedisLibrary');

            // Cleanup expired sessions
            const expiredSessions = await this.sessionManager.cleanupExpiredSessions();

            logger.info('Redis library cleanup completed', 'RedisLibrary', {
                expiredSessions
            });

            return {
                sessions: expiredSessions
            };
        } catch (error) {
            logger.error('Cleanup failed', 'RedisLibrary', { error });
            throw error;
        }
    }
}