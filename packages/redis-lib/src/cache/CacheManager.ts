import { RedisClient } from '../client/RedisClient';
import logger from '@repo/logger';

export interface CacheOptions {
    ttl?: number; // Time to live in seconds
    prefix?: string; // Key prefix
    serialize?: boolean; // Whether to serialize/deserialize values
    compress?: boolean; // Whether to compress values
}

export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    expires: number;
    hitRate: number;
}

export class CacheManager {
    private redisClient: RedisClient;
    private stats: CacheStats;
    private defaultOptions: Required<CacheOptions>;

    constructor(redisClient: RedisClient, defaultOptions: CacheOptions = {}) {
        this.redisClient = redisClient;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            expires: 0,
            hitRate: 0
        };
        this.defaultOptions = {
            ttl: 3600, 
            prefix: 'cache:',
            serialize: true,
            compress: false,
            ...defaultOptions
        };
    }

    /**
     * Get value from cache
     */
    public async get<T = any>(key: string, options: Partial<CacheOptions> = {}): Promise<T | null> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKey = this.buildKey(key, opts.prefix);

        try {
            const value = await this.redisClient.executeCommand<string>('get', fullKey);

            if (value === null) {
                this.stats.misses++;
                this.updateHitRate();
                logger.debug(`Cache miss: ${fullKey}`, 'CacheManager');
                return null;
            }

            this.stats.hits++;
            this.updateHitRate();
            logger.debug(`Cache hit: ${fullKey}`, 'CacheManager');

            return this.deserializeValue<T>(value, opts);
        } catch (error) {
            logger.error(`Cache get error: ${fullKey}`, 'CacheManager', { error });
            this.stats.misses++;
            this.updateHitRate();
            return null;
        }
    }

    /**
     * Set value in cache
     */
    public async set<T = any>(
        key: string,
        value: T,
        options: Partial<CacheOptions> = {}
    ): Promise<boolean> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKey = this.buildKey(key, opts.prefix);

        try {
            const serializedValue = this.serializeValue(value, opts);

            if (opts.ttl > 0) {
                await this.redisClient.executeCommand('setex', fullKey, opts.ttl, serializedValue);
            } else {
                await this.redisClient.executeCommand('set', fullKey, serializedValue);
            }

            this.stats.sets++;
            logger.debug(`Cache set: ${fullKey}`, 'CacheManager', { ttl: opts.ttl });
            return true;
        } catch (error) {
            logger.error(`Cache set error: ${fullKey}`, 'CacheManager', { error });
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    public async delete(key: string, options: Partial<CacheOptions> = {}): Promise<boolean> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKey = this.buildKey(key, opts.prefix);

        try {
            const result = await this.redisClient.executeCommand<number>('del', fullKey);
            this.stats.deletes++;
            logger.debug(`Cache delete: ${fullKey}`, 'CacheManager', { deleted: result > 0 });
            return result > 0;
        } catch (error) {
            logger.error(`Cache delete error: ${fullKey}`, 'CacheManager', { error });
            return false;
        }
    }

    /**
     * Check if key exists in cache
     */
    public async exists(key: string, options: Partial<CacheOptions> = {}): Promise<boolean> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKey = this.buildKey(key, opts.prefix);

        try {
            const result = await this.redisClient.executeCommand<number>('exists', fullKey);
            return result > 0;
        } catch (error) {
            logger.error(`Cache exists error: ${fullKey}`, 'CacheManager', { error });
            return false;
        }
    }

    /**
     * Get multiple values from cache
     */
    public async mget<T = any>(keys: string[], options: Partial<CacheOptions> = {}): Promise<(T | null)[]> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKeys = keys.map(key => this.buildKey(key, opts.prefix));

        try {
            const values = await this.redisClient.executeCommand<(string | null)[]>('mget', ...fullKeys);

            return values.map((value, index) => {
                if (value === null) {
                    this.stats.misses++;
                    return null;
                }
                this.stats.hits++;
                return this.deserializeValue<T>(value, opts);
            });
        } catch (error) {
            logger.error(`Cache mget error`, 'CacheManager', { error, keys });
            return keys.map(() => null);
        } finally {
            this.updateHitRate();
        }
    }

    /**
     * Set multiple values in cache
     */
    public async mset<T = any>(
        keyValuePairs: Array<{ key: string; value: T }>,
        options: Partial<CacheOptions> = {}
    ): Promise<boolean> {
        const opts = { ...this.defaultOptions, ...options };
        const pipeline = [];

        for (const { key, value } of keyValuePairs) {
            const fullKey = this.buildKey(key, opts.prefix);
            const serializedValue = this.serializeValue(value, opts);

            if (opts.ttl > 0) {
                pipeline.push(['setex', fullKey, opts.ttl, serializedValue]);
            } else {
                pipeline.push(['set', fullKey, serializedValue]);
            }
        }

        try {
            await this.redisClient.executeCommand('mset', ...pipeline.flat());
            this.stats.sets += keyValuePairs.length;
            logger.debug(`Cache mset: ${keyValuePairs.length} keys`, 'CacheManager');
            return true;
        } catch (error) {
            logger.error(`Cache mset error`, 'CacheManager', { error });
            return false;
        }
    }

    /**
     * Get and delete value from cache
     */
    public async getAndDelete<T = any>(key: string, options: Partial<CacheOptions> = {}): Promise<T | null> {
        const value = await this.get<T>(key, options);
        if (value !== null) {
            await this.delete(key, options);
        }
        return value;
    }

    /**
     * Set value only if it doesn't exist
     */
    public async setIfNotExists<T = any>(
        key: string,
        value: T,
        options: Partial<CacheOptions> = {}
    ): Promise<boolean> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKey = this.buildKey(key, opts.prefix);

        try {
            const serializedValue = this.serializeValue(value, opts);
            const result = await this.redisClient.executeCommand<number>('setnx', fullKey, serializedValue);

            if (result === 1 && opts.ttl > 0) {
                await this.redisClient.executeCommand('expire', fullKey, opts.ttl);
            }

            if (result === 1) {
                this.stats.sets++;
                logger.debug(`Cache setnx: ${fullKey}`, 'CacheManager');
            }

            return result === 1;
        } catch (error) {
            logger.error(`Cache setnx error: ${fullKey}`, 'CacheManager', { error });
            return false;
        }
    }

    /**
     * Increment numeric value
     */
    public async increment(key: string, by: number = 1, options: Partial<CacheOptions> = {}): Promise<number> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKey = this.buildKey(key, opts.prefix);

        try {
            const result = await this.redisClient.executeCommand<number>('incrby', fullKey, by);
            logger.debug(`Cache increment: ${fullKey} by ${by}`, 'CacheManager');
            return result;
        } catch (error) {
            logger.error(`Cache increment error: ${fullKey}`, 'CacheManager', { error });
            throw error;
        }
    }

    /**
     * Decrement numeric value
     */
    public async decrement(key: string, by: number = 1, options: Partial<CacheOptions> = {}): Promise<number> {
        return this.increment(key, -by, options);
    }

    /**
     * Get TTL of key
     */
    public async ttl(key: string, options: Partial<CacheOptions> = {}): Promise<number> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKey = this.buildKey(key, opts.prefix);

        try {
            return await this.redisClient.executeCommand<number>('ttl', fullKey);
        } catch (error) {
            logger.error(`Cache ttl error: ${fullKey}`, 'CacheManager', { error });
            return -1;
        }
    }

    /**
     * Set TTL for key
     */
    public async expire(key: string, ttl: number, options: Partial<CacheOptions> = {}): Promise<boolean> {
        const opts = { ...this.defaultOptions, ...options };
        const fullKey = this.buildKey(key, opts.prefix);

        try {
            const result = await this.redisClient.executeCommand<number>('expire', fullKey, ttl);
            return result === 1;
        } catch (error) {
            logger.error(`Cache expire error: ${fullKey}`, 'CacheManager', { error });
            return false;
        }
    }

    /**
     * Clear all cache keys with prefix
     */
    public async clear(prefix?: string): Promise<number> {
        const searchPrefix = prefix || this.defaultOptions.prefix;
        const pattern = `${searchPrefix}*`;

        try {
            const keys = await this.redisClient.executeCommand<string[]>('keys', pattern);
            if (keys.length === 0) return 0;

            const result = await this.redisClient.executeCommand<number>('del', ...keys);
            this.stats.deletes += result;
            logger.debug(`Cache clear: ${result} keys deleted`, 'CacheManager', { pattern });
            return result;
        } catch (error) {
            logger.error(`Cache clear error`, 'CacheManager', { error, pattern });
            return 0;
        }
    }

    /**
     * Get cache keys matching pattern
     */
    public async keys(pattern: string): Promise<string[]> {
        try {
            return await this.redisClient.executeCommand<string[]>('keys', pattern);
        } catch (error) {
            logger.error(`Cache keys error`, 'CacheManager', { error, pattern });
            return [];
        }
    }

    /**
     * Get cache statistics
     */
    public getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Reset cache statistics
     */
    public resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            expires: 0,
            hitRate: 0
        };
    }

    /**
     * Build full key with prefix
     */
    private buildKey(key: string, prefix: string): string {
        return `${prefix}${key}`;
    }

    /**
     * Serialize value
     */
    private serializeValue<T>(value: T, options: Required<CacheOptions>): string {
        if (!options.serialize) {
            return String(value);
        }

        try {
            return JSON.stringify(value);
        } catch (error) {
            logger.error('Cache serialization error', 'CacheManager', { error });
            return String(value);
        }
    }

    /**
     * Deserialize value
     */
    private deserializeValue<T>(value: string, options: Required<CacheOptions>): T {
        if (!options.serialize) {
            return value as unknown as T;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            logger.error('Cache deserialization error', 'CacheManager', { error });
            return value as unknown as T;
        }
    }

    /**
     * Update hit rate
     */
    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    }
}
