import { Redis, RedisOptions, Cluster } from 'ioredis';
import logger from '@repo/logger';

export interface RedisConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number | null;
    lazyConnect?: boolean;
    keepAlive?: number;
    family?: number;
    connectTimeout?: number;
    commandTimeout?: number;
    retryDelayOnClusterDown?: number;
    enableOfflineQueue?: boolean;
    maxLoadingTimeout?: number;
    enableReadyCheck?: boolean;
    maxMemoryPolicy?: string;
    maxmemory?: string;

    cluster?: {
        enableReadyCheck?: boolean;
        maxRedirections?: number;
        retryDelayOnFailover?: number;
        retryDelayOnClusterDown?: number;
        maxRetriesPerRequest?: number | null;
        scaleReads?: 'master' | 'slave' | 'all';
        enableOfflineQueue?: boolean;
    };
    sentinel?: {
        sentinels: Array<{ host: string; port: number }>;
        name: string;
        password?: string;
        db?: number;
        role?: 'master' | 'slave';
    };
}

export interface RedisConnectionStats {
    connected: boolean;
    ready: boolean;
    mode: 'standalone' | 'cluster' | 'sentinel';
    totalConnections: number;
    activeConnections: number;
    memoryUsage?: string;
    uptime?: number;
    lastError?: string;
    lastErrorTime?: Date;
}

export class RedisClient {
    private client: Redis | Cluster | null = null;
    private config: RedisConfig;
    private isConnected: boolean = false;
    private isReady: boolean = false;
    private connectionAttempts: number = 0;
    private maxConnectionAttempts: number = 5;
    private reconnectDelay: number = 1000;
    private lastError: string | null = null;
    private lastErrorTime: Date | null = null;
    private startTime: Date = new Date();

    constructor(config: RedisConfig) {
        this.config = {
            // Default values
            host: 'localhost',
            port: 6379,
            password: undefined,
            db: 0,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3, // Changed from null to 3 to prevent infinite retries
            lazyConnect: true,
            keepAlive: 30000,
            family: 4,
            connectTimeout: 60000, // Increased to 60s
            commandTimeout: 60000, // Increased to 60s
            enableOfflineQueue: false, // Changed to true to queue commands when disconnected
            maxLoadingTimeout: 10000, // Increased to 10s
            enableReadyCheck: true,
            maxMemoryPolicy: 'allkeys-lru',
            maxmemory: '2gb',
            ...config
        };
    }

    /**
     * Connect to Redis
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            logger.info('Redis already connected', 'RedisClient');
            return;
        }

        try {
            logger.info('Connecting to Redis...', 'RedisClient', { config: this.config });

            if (this.config.cluster) {
                this.client = new Cluster([{ host: this.config.host!, port: this.config.port! }], {
                    redisOptions: this.config,
                    ...this.config.cluster
                });
            } else if (this.config.sentinel) {
                this.client = new Redis({
                    sentinels: this.config.sentinel.sentinels,
                    name: this.config.sentinel.name,
                    password: this.config.sentinel.password,
                    db: this.config.sentinel.db,
                    role: this.config.sentinel.role || 'master',
                    ...this.config
                });
            } else {
                this.client = new Redis(this.config);
            }

            this.setupEventListeners();
            await this.client.connect();

            this.isConnected = true;
            this.isReady = true;
            this.connectionAttempts = 0;
            this.lastError = null;
            this.lastErrorTime = null;

            logger.info('Successfully connected to Redis', 'RedisClient', {
                mode: this.getMode(),
                host: this.config.host,
                port: this.config.port
            });
        } catch (error) {
            console.log("Error", error)
            this.handleConnectionError(error as Error);
            throw error;
        }
    }

    /**
     * Disconnect from Redis
     */
    public async disconnect(): Promise<void> {
        if (!this.client) {
            logger.info('Redis client not initialized', 'RedisClient');
            return;
        }

        try {
            await this.client.quit();
            this.isConnected = false;
            this.isReady = false;

            logger.info('Disconnected from Redis', 'RedisClient');
        } catch (error) {
            logger.error('Error disconnecting from Redis', 'RedisClient', { error });
            throw error;
        }
    }

    /**
     * Get Redis client instance
     */
    public getClient(): Redis | Cluster | null {
        return this.client;
    }

    /**
     * Check if client is connected
     */
    public isClientConnected(): boolean {
        return this.isConnected && this.isReady;
    }

    /**
     * Get connection statistics
     */
    public getStats(): RedisConnectionStats {
        const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

        return {
            connected: this.isConnected,
            ready: this.isReady,
            mode: this.getMode(),
            totalConnections: this.connectionAttempts,
            activeConnections: this.isConnected ? 1 : 0,
            uptime,
            lastError: this.lastError || undefined,
            lastErrorTime: this.lastErrorTime || undefined
        };
    }

    /**
     * Get Redis mode
     */
    private getMode(): 'standalone' | 'cluster' | 'sentinel' {
        if (this.config.cluster) return 'cluster';
        if (this.config.sentinel) return 'sentinel';
        return 'standalone';
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        if (!this.client) return;

        this.client.on('connect', () => {
            logger.info('Redis connection established', 'RedisClient');
            this.isConnected = true;
        });

        this.client.on('ready', () => {
            logger.info('Redis client ready', 'RedisClient');
            this.isReady = true;
        });

        this.client.on('error', (error) => {
            this.handleError(error);
        });

        this.client.on('close', () => {
            logger.info('Redis connection closed', 'RedisClient');
            this.isConnected = false;
            this.isReady = false;
        });

        this.client.on('reconnecting', (delay: number) => {
            logger.info(`Redis reconnecting in ${delay}ms`, 'RedisClient');
        });

        this.client.on('end', () => {
            logger.info('Redis connection ended', 'RedisClient');
            this.isConnected = false;
            this.isReady = false;
        });
    }

    /**
     * Handle connection errors
     */
    private handleConnectionError(error: Error): void {
        this.lastError = error.message;
        this.lastErrorTime = new Date();
        this.connectionAttempts++;

        logger.error('Redis connection failed', 'RedisClient', {
            error: error.message,
            attempt: this.connectionAttempts,
            maxAttempts: this.maxConnectionAttempts
        });

        if (this.connectionAttempts < this.maxConnectionAttempts) {
            setTimeout(() => {
                this.connect().catch(() => {
                    // Error already logged
                });
            }, this.reconnectDelay * this.connectionAttempts);
        }
    }

    /**
     * Handle Redis errors
     */
    private handleError(error: any): void {
        this.lastError = error.message;
        this.lastErrorTime = new Date();

        logger.error('Redis error occurred', 'RedisClient', { error: error.message });

        // Handle specific error types
        if (error.message.includes('ECONNREFUSED')) {
            logger.info('Redis server is not running', 'RedisClient');
        } else if (error.message.includes('NOAUTH')) {
            logger.info('Redis authentication failed', 'RedisClient');
        } else if (error.message.includes('WRONGPASS')) {
            logger.info('Redis password is incorrect', 'RedisClient');
        }
    }

    /**
     * Execute Redis command with error handling
     */
    public async executeCommand<T = any>(command: string, ...args: any[]): Promise<T> {
        if (!this.client || !this.isClientConnected()) {
            throw new Error('Redis client not connected');
        }

        try {
            const result = await (this.client as any)[command](...args);
            logger.debug(`Redis command executed: ${command}`, 'RedisClient', { args });
            return result;
        } catch (error) {
            logger.error(`Redis command failed: ${command}`, 'RedisClient', {
                error: (error as Error).message,
                args
            });
            throw error;
        }
    }

    /**
     * Ping Redis server
     */
    public async ping(): Promise<string> {
        return this.executeCommand<string>('ping');
    }

    /**
     * Get Redis info
     */
    public async info(section?: string): Promise<string> {
        return this.executeCommand<string>('info', section);
    }

    /**
     * Get Redis memory usage
     */
    public async memoryUsage(key: string): Promise<number> {
        return this.executeCommand<number>('memory', 'usage', key);
    }

    /**
     * Get Redis database size
     */
    public async dbSize(): Promise<number> {
        return this.executeCommand<number>('dbsize');
    }

    /**
     * Flush all databases
     */
    public async flushAll(): Promise<string> {
        return this.executeCommand<string>('flushall');
    }

    /**
     * Flush current database
     */
    public async flushDb(): Promise<string> {
        return this.executeCommand<string>('flushdb');
    }
}