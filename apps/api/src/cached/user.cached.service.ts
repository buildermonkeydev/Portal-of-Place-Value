import { CacheService } from '../core/infrastructure/Cache';
import { USER_CACHE_KEYS } from '../shared/constants/user-cache-keys';
import { IUserDocument } from '../core/types';
import { Logger } from '@repo/logger';

const logger = new Logger();

export class UserCachedService {
    private cacheService: CacheService;

    constructor() {
        this.cacheService = new CacheService();
    }

    /**
     * Get user by ID from cache
     */
    async getUser(userId: string): Promise<IUserDocument | null> {
        try {
            const key = USER_CACHE_KEYS.USER_BY_ID(userId);
            return await this.cacheService.get<IUserDocument>(key);
        } catch (error) {
            logger.error('Failed to get user from cache', 'UserCachedService', { userId, error });
            return null;
        }
    }

    /**
     * Set user in cache
     */
    async setUser(userId: string, user: IUserDocument, ttl?: number): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_BY_ID(userId);
            await this.cacheService.set(key, user, { ttl });
            logger.debug('User cached successfully', 'UserCachedService', { userId });
        } catch (error) {
            logger.error('Failed to cache user', 'UserCachedService', { userId, error });
        }
    }

    /**
     * Get user by email from cache
     */
    async getUserByEmail(email: string): Promise<IUserDocument | null> {
        try {
            const key = USER_CACHE_KEYS.USER_BY_EMAIL(email);
            return await this.cacheService.get<IUserDocument>(key);
        } catch (error) {
            logger.error('Failed to get user by email from cache', 'UserCachedService', { email, error });
            return null;
        }
    }

    /**
     * Set user by email in cache
     */
    async setUserByEmail(email: string, user: IUserDocument, ttl?: number): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_BY_EMAIL(email);
            await this.cacheService.set(key, user, { ttl });
            logger.debug('User cached by email successfully', 'UserCachedService', { email });
        } catch (error) {
            logger.error('Failed to cache user by email', 'UserCachedService', { email, error });
        }
    }

    /**
     * Get user session from cache
     */
    async getUserSession(userId: string): Promise<any | null> {
        try {
            const key = USER_CACHE_KEYS.USER_SESSION(userId);
            return await this.cacheService.get<any>(key);
        } catch (error) {
            logger.error('Failed to get user session from cache', 'UserCachedService', { userId, error });
            return null;
        }
    }

    /**
     * Set user session in cache
     */
    async setUserSession(userId: string, sessionData: any, ttl?: number): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_SESSION(userId);
            await this.cacheService.set(key, sessionData, { ttl });
            logger.debug('User session cached successfully', 'UserCachedService', { userId });
        } catch (error) {
            logger.error('Failed to cache user session', 'UserCachedService', { userId, error });
        }
    }

    /**
     * Get user profile from cache
     */
    async getUserProfile(userId: string): Promise<any | null> {
        try {
            const key = USER_CACHE_KEYS.USER_PROFILE(userId);
            return await this.cacheService.get<any>(key);
        } catch (error) {
            logger.error('Failed to get user profile from cache', 'UserCachedService', { userId, error });
            return null;
        }
    }

    /**
     * Set user profile in cache
     */
    async setUserProfile(userId: string, profile: any, ttl?: number): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_PROFILE(userId);
            await this.cacheService.set(key, profile, { ttl });
            logger.debug('User profile cached successfully', 'UserCachedService', { userId });
        } catch (error) {
            logger.error('Failed to cache user profile', 'UserCachedService', { userId, error });
        }
    }

    /**
     * Get user by registration number from cache
     */
    async getUserByRegistration(registrationNo: string): Promise<IUserDocument | null> {
        try {
            const key = USER_CACHE_KEYS.USER_BY_REGISTRATION(registrationNo);
            return await this.cacheService.get<IUserDocument>(key);
        } catch (error) {
            logger.error('Failed to get user by registration from cache', 'UserCachedService', { registrationNo, error });
            return null;
        }
    }

    /**
     * Set user by registration number in cache
     */
    async setUserByRegistration(registrationNo: string, user: IUserDocument, ttl?: number): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_BY_REGISTRATION(registrationNo);
            await this.cacheService.set(key, user, { ttl });
            logger.debug('User cached by registration successfully', 'UserCachedService', { registrationNo });
        } catch (error) {
            logger.error('Failed to cache user by registration', 'UserCachedService', { registrationNo, error });
        }
    }

    /**
     * Get user list from cache
     */
    async getUserList(filters: string): Promise<IUserDocument[] | null> {
        try {
            const key = USER_CACHE_KEYS.USER_LIST(filters);
            return await this.cacheService.get<IUserDocument[]>(key);
        } catch (error) {
            logger.error('Failed to get user list from cache', 'UserCachedService', { filters, error });
            return null;
        }
    }

    /**
     * Set user list in cache
     */
    async setUserList(filters: string, users: IUserDocument[], ttl?: number): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_LIST(filters);
            await this.cacheService.set(key, users, { ttl });
            logger.debug('User list cached successfully', 'UserCachedService', { filters, count: users.length });
        } catch (error) {
            logger.error('Failed to cache user list', 'UserCachedService', { filters, error });
        }
    }

    /**
     * Get user stats from cache
     */
    async getUserStats(userId: string): Promise<any | null> {
        try {
            const key = USER_CACHE_KEYS.USER_STATS(userId);
            return await this.cacheService.get<any>(key);
        } catch (error) {
            logger.error('Failed to get user stats from cache', 'UserCachedService', { userId, error });
            return null;
        }
    }

    /**
     * Set user stats in cache
     */
    async setUserStats(userId: string, stats: any, ttl?: number): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_STATS(userId);
            await this.cacheService.set(key, stats, { ttl });
            logger.debug('User stats cached successfully', 'UserCachedService', { userId });
        } catch (error) {
            logger.error('Failed to cache user stats', 'UserCachedService', { userId, error });
        }
    }

    /**
     * Invalidate user cache
     */
    async invalidateUserCache(userId: string): Promise<void> {
        try {
            const keys = [
                USER_CACHE_KEYS.USER_BY_ID(userId),
                USER_CACHE_KEYS.USER_SESSION(userId),
                USER_CACHE_KEYS.USER_PROFILE(userId),
                USER_CACHE_KEYS.USER_STATS(userId),
                USER_CACHE_KEYS.USER_ACTIVITY(userId),
                USER_CACHE_KEYS.USER_PERMISSIONS(userId),
                USER_CACHE_KEYS.USER_PREFERENCES(userId),
            ];

            // Delete all user-related cache keys
            const deletePromises = keys.map(key => this.cacheService.delete(key));
            await Promise.all(deletePromises);

            logger.info('User cache invalidated successfully', 'UserCachedService', {
                userId,
                keysInvalidated: keys.length
            });
        } catch (error) {
            logger.error('Failed to invalidate user cache', 'UserCachedService', { userId, error });
        }
    }

    /**
     * Invalidate user cache by email
     */
    async invalidateUserCacheByEmail(email: string): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_BY_EMAIL(email);

            await this.cacheService.delete(key);
            logger.debug('User cache invalidated by email successfully', 'UserCachedService', { email });
        } catch (error) {
            logger.error('Failed to invalidate user cache by email', 'UserCachedService', { email, error });
        }
    }

    /**
     * Invalidate user cache by registration
     */
    async invalidateUserCacheByRegistration(registrationNo: string): Promise<void> {
        try {
            const key = USER_CACHE_KEYS.USER_BY_REGISTRATION(registrationNo);
            await this.cacheService.delete(key);
            logger.debug('User cache invalidated by registration successfully', 'UserCachedService', { registrationNo });
        } catch (error) {
            logger.error('Failed to invalidate user cache by registration', 'UserCachedService', { registrationNo, error });
        }
    }

    /**
     * Invalidate all user list caches
     */
    async invalidateUserListCaches(): Promise<void> {
        try {
            // Get all keys that match the user list pattern
            const pattern = 'user:list:*';
            const keys = await this.cacheService.keys(pattern);

            if (keys && keys.length > 0) {
                const deletePromises = keys.map(key => this.cacheService.delete(key));
                await Promise.all(deletePromises);

                logger.info('User list caches invalidated successfully', 'UserCachedService', {
                    keysInvalidated: keys.length
                });
            } else {
                logger.debug('No user list caches found to invalidate', 'UserCachedService');
            }
        } catch (error) {
            logger.error('Failed to invalidate user list caches', 'UserCachedService', { error });
        }
    }
}

// Lazy-loaded singleton to avoid Redis dependency during module loading
let _userCachedService: UserCachedService | null = null;

export const userCachedService = {
    async getUser(userId: string) {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.getUser(userId);
    },
    async setUser(userId: string, user: IUserDocument, ttl?: number) {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.setUser(userId, user, ttl);
    },
    async getUserByEmail(email: string) {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.getUserByEmail(email);
    },
    async setUserByEmail(email: string, user: IUserDocument, ttl?: number) {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.setUserByEmail(email, user, ttl);
    },
    async setUserSession(userId: string, sessionData: any, ttl?: number) {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.setUserSession(userId, sessionData, ttl);
    },
    async invalidateUserCache(userId: string) {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.invalidateUserCache(userId);
    },
    async invalidateUserCacheByEmail(email: string) {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.invalidateUserCacheByEmail(email);
    },
    async invalidateUserListCaches() {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.invalidateUserListCaches();
    },
    async invalidateUserCacheByRegistration(registrationNo: string) {
        if (!_userCachedService) _userCachedService = new UserCachedService();
        return _userCachedService.invalidateUserCacheByRegistration(registrationNo);
    }
};
