import { CacheManager, CacheOptions, CacheStats } from "@repo/redis-lib";
import { redisService } from "./Redis";
import { Logger } from "@repo/logger";

const logger = new Logger();
export class CacheService {
    private cacheManager: CacheManager;

    constructor() {
        this.cacheManager = redisService.getCacheManager();
    }

    async get<T>(key: string, options?: Partial<CacheOptions>): Promise<T | null> {
        try {
            return await this.cacheManager.get<T>(key, options);
        } catch (error) {
            logger.error(`Failed to get cache`, 'CacheService', { error });
            return null;
        }
    }

    async set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void> {
        try {
            await this.cacheManager.set(key, value, options);
        } catch (error) {
            logger.error(`Failed to set cache`, 'CacheService', { error });
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.cacheManager.delete(key);
        } catch (error) {
            logger.error(`Failed to delete cache`, 'CacheService', { error });
        }
    }

    async getCacheStats(): Promise<CacheStats | null> {
        try {
            return this.cacheManager.getStats();
        } catch (error) {
            logger.error(`Failed to get cache stats`, 'CacheService', { error });
            return null;
        }
    }

    async keys(pattern: string): Promise<string[]> {
        try {
            return await this.cacheManager.keys(pattern);
        } catch (error) {
            logger.error(`Failed to get cache keys`, 'CacheService', { error });
            return [];
        }
    }



    async invalidateUser(userId: string, email: string): Promise<void> {
        try {
            const keysToDelete = [
                `user:${userId}`,
                `user:email:${email.toLowerCase()}`
            ];

            await Promise.all(
                keysToDelete.map(key => this.cacheManager.delete(key))
            );
        } catch (error) {
            logger.error(`Failed to invalidate user cache`, 'CacheService', { userId, email, error });
        }
    }
}