/**
 * User Cache Keys Constants
 * Defines all cache keys used for user-related caching
 */

export const USER_CACHE_KEYS = {
    // User by ID
    USER_BY_ID: (userId: string) => `user:${userId}`,

    // User by Email
    USER_BY_EMAIL: (email: string) => `user:email:${email.toLowerCase()}`,

    // User Session
    USER_SESSION: (userId: string) => `user:session:${userId}`,

    // User Profile
    USER_PROFILE: (userId: string) => `user:profile:${userId}`,

    // User by Registration Number
    USER_BY_REGISTRATION: (regNo: string) => `user:registration:${regNo}`,

    // User List (with filters)
    USER_LIST: (filters: string) => `user:list:${filters}`,

    // User Stats
    USER_STATS: (userId: string) => `user:stats:${userId}`,

    // User Activity
    USER_ACTIVITY: (userId: string) => `user:activity:${userId}`,

    // User Permissions
    USER_PERMISSIONS: (userId: string) => `user:permissions:${userId}`,

    // User Preferences
    USER_PREFERENCES: (userId: string) => `user:preferences:${userId}`,
} as const;

export type UserCacheKey = typeof USER_CACHE_KEYS[keyof typeof USER_CACHE_KEYS];
