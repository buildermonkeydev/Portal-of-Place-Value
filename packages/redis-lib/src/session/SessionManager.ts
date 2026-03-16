import { RedisClient } from '../client/RedisClient';
import logger from '@repo/logger';

export interface SessionData {
    userId: string;
    sessionId: string;
    userAgent?: string;
    ipAddress?: string;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
    data?: Record<string, any>;
}

export interface SessionOptions {
    ttl?: number; // Session TTL in seconds
    prefix?: string; // Key prefix
    extendOnActivity?: boolean; // Extend TTL on activity
    maxSessionsPerUser?: number; // Maximum sessions per user
}

export interface SessionStats {
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    userSessions: Record<string, number>;
}

export class SessionManager {
    private redisClient: RedisClient;
    private cacheManager: any; // Will be injected
    private options: Required<SessionOptions>;

    constructor(redisClient: RedisClient, options: SessionOptions = {}) {
        this.redisClient = redisClient;
        this.options = {
            ttl: 24 * 60 * 60, // 24 hours default
            prefix: 'session:',
            extendOnActivity: true,
            maxSessionsPerUser: 5,
            ...options
        };
    }

    /**
     * Create a new session
     */
    public async createSession(
        userId: string,
        sessionId: string,
        userAgent?: string,
        ipAddress?: string,
        data?: Record<string, any>
    ): Promise<SessionData> {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.options.ttl * 1000);

        const sessionData: SessionData = {
            userId,
            sessionId,
            userAgent,
            ipAddress,
            createdAt: now,
            lastActivity: now,
            expiresAt,
            data: data || {}
        };

        try {
            // Check session limits
            await this.enforceSessionLimits(userId);

            // Store session data
            const key = this.buildSessionKey(sessionId);
            await this.redisClient.executeCommand('setex', key, this.options.ttl, JSON.stringify(sessionData));

            // Store user session mapping
            await this.addUserSession(userId, sessionId);

            logger.info(`Session created: ${sessionId} for user: ${userId}`, 'SessionManager');
            return sessionData;
        } catch (error) {
            logger.error(`Session creation failed: ${sessionId}`, 'SessionManager', { error });
            throw error;
        }
    }

    /**
     * Get session data
     */
    /**
     * Get session data
     */
    public async getSession(sessionId: string): Promise<SessionData | null> {
        const sessionData = await this._getSession(sessionId);

        if (sessionData && this.options.extendOnActivity) {
            // Update last activity asynchronously to not block response
            this.updateLastActivity(sessionId).catch(err =>
                logger.error(`Failed to update last activity for session ${sessionId}`, 'SessionManager', { error: err })
            );
        }

        return sessionData;
    }

    /**
     * Internal get session without side effects
     */
    private async _getSession(sessionId: string): Promise<SessionData | null> {
        try {
            const key = this.buildSessionKey(sessionId);
            const data = await this.redisClient.executeCommand<string>('get', key);

            if (!data) {
                logger.debug(`Session not found: ${sessionId}`, 'SessionManager');
                return null;
            }

            const sessionData = JSON.parse(data) as SessionData;

            // Check if session is expired
            if (new Date() > new Date(sessionData.expiresAt)) {
                await this.deleteSession(sessionId);
                logger.debug(`Session expired: ${sessionId}`, 'SessionManager');
                return null;
            }

            logger.debug(`Session retrieved: ${sessionId}`, 'SessionManager');
            return sessionData;
        } catch (error) {
            logger.error(`Session retrieval failed: ${sessionId}`, 'SessionManager', { error });
            return null;
        }
    }

    /**
     * Update session data
     */
    public async updateSession(
        sessionId: string,
        updates: Partial<SessionData>
    ): Promise<boolean> {
        try {
            const sessionData = await this.getSession(sessionId);
            if (!sessionData) {
                return false;
            }

            const updatedData = { ...sessionData, ...updates, lastActivity: new Date() };
            const key = this.buildSessionKey(sessionId);

            await this.redisClient.executeCommand('setex', key, this.options.ttl, JSON.stringify(updatedData));

            logger.debug(`Session updated: ${sessionId}`, 'SessionManager');
            return true;
        } catch (error) {
            logger.error(`Session update failed: ${sessionId}`, 'SessionManager', { error });
            return false;
        }
    }

    /**
     * Delete session
     */
    public async deleteSession(sessionId: string): Promise<boolean> {
        try {
            const sessionData = await this.getSession(sessionId);
            if (!sessionData) {
                return false;
            }

            const key = this.buildSessionKey(sessionId);
            await this.redisClient.executeCommand('del', key);

            // Remove from user sessions
            await this.removeUserSession(sessionData.userId, sessionId);

            logger.session(`Session deleted: ${sessionId}`, 'SessionManager');
            return true;
        } catch (error) {
            logger.error(`Session deletion failed: ${sessionId}`, 'SessionManager', { error });
            return false;
        }
    }

    /**
     * Delete all sessions for a user
     */
    public async deleteUserSessions(userId: string): Promise<number> {
        try {
            const userSessionsKey = this.buildUserSessionsKey(userId);
            const sessionIds = await this.redisClient.executeCommand<string[]>('smembers', userSessionsKey);

            if (sessionIds.length === 0) {
                return 0;
            }

            // Delete all session data
            const sessionKeys = sessionIds.map(id => this.buildSessionKey(id));
            await this.redisClient.executeCommand('del', ...sessionKeys);

            // Delete user sessions set
            await this.redisClient.executeCommand('del', userSessionsKey);

            logger.session(`Deleted ${sessionIds.length} sessions for user: ${userId}`, 'SessionManager');
            return sessionIds.length;
        } catch (error) {
            logger.error(`User sessions deletion failed: ${userId}`, 'SessionManager', { error });
            return 0;
        }
    }

    /**
     * Get all sessions for a user
     */
    public async getUserSessions(userId: string): Promise<SessionData[]> {
        try {
            const userSessionsKey = this.buildUserSessionsKey(userId);
            const sessionIds = await this.redisClient.executeCommand<string[]>('smembers', userSessionsKey);

            const sessions: SessionData[] = [];
            for (const sessionId of sessionIds) {
                const session = await this.getSession(sessionId);
                if (session) {
                    sessions.push(session);
                }
            }

            return sessions;
        } catch (error) {
            logger.error(`Get user sessions failed: ${userId}`, 'SessionManager', { error });
            return [];
        }
    }

    /**
     * Clean up expired sessions
     */
    public async cleanupExpiredSessions(): Promise<number> {
        try {
            const pattern = `${this.options.prefix}*`;
            const sessionKeys = await this.redisClient.executeCommand<string[]>('keys', pattern);

            let cleanedCount = 0;
            for (const key of sessionKeys) {
                const data = await this.redisClient.executeCommand<string>('get', key);
                if (data) {
                    const sessionData = JSON.parse(data) as SessionData;
                    if (new Date() > new Date(sessionData.expiresAt)) {
                        await this.redisClient.executeCommand('del', key);
                        await this.removeUserSession(sessionData.userId, sessionData.sessionId);
                        cleanedCount++;
                    }
                }
            }

            logger.session(`Cleaned up ${cleanedCount} expired sessions`, 'SessionManager');
            return cleanedCount;
        } catch (error) {
            logger.error('Session cleanup failed', 'SessionManager', { error });
            return 0;
        }
    }

    /**
     * Get session statistics
     */
    public async getStats(): Promise<SessionStats> {
        try {
            const pattern = `${this.options.prefix}*`;
            const sessionKeys = await this.redisClient.executeCommand<string[]>('keys', pattern);

            const stats: SessionStats = {
                totalSessions: 0,
                activeSessions: 0,
                expiredSessions: 0,
                userSessions: {}
            };

            const now = new Date();
            for (const key of sessionKeys) {
                const data = await this.redisClient.executeCommand<string>('get', key);
                if (data) {
                    const sessionData = JSON.parse(data) as SessionData;
                    stats.totalSessions++;

                    if (now > new Date(sessionData.expiresAt)) {
                        stats.expiredSessions++;
                    } else {
                        stats.activeSessions++;
                        stats.userSessions[sessionData.userId] = (stats.userSessions[sessionData.userId] || 0) + 1;
                    }
                }
            }

            return stats;
        } catch (error) {
            logger.error('Session stats failed', 'SessionManager', { error });
            return {
                totalSessions: 0,
                activeSessions: 0,
                expiredSessions: 0,
                userSessions: {}
            };
        }
    }

    /**
     * Extend session TTL
     */
    public async extendSession(sessionId: string, ttl?: number): Promise<boolean> {
        try {
            const sessionData = await this.getSession(sessionId);
            if (!sessionData) {
                return false;
            }

            const newTtl = ttl || this.options.ttl;
            const key = this.buildSessionKey(sessionId);

            await this.redisClient.executeCommand('expire', key, newTtl);

            // Update expiresAt in session data
            const newExpiresAt = new Date(Date.now() + newTtl * 1000);
            await this.updateSession(sessionId, { expiresAt: newExpiresAt });

            logger.debug(`Session extended: ${sessionId}`, 'SessionManager', { ttl: newTtl });
            return true;
        } catch (error) {
            logger.error(`Session extension failed: ${sessionId}`, 'SessionManager', { error });
            return false;
        }
    }

    /**
     * Build session key
     */
    private buildSessionKey(sessionId: string): string {
        return `${this.options.prefix}${sessionId}`;
    }

    /**
     * Build user sessions key
     */
    private buildUserSessionsKey(userId: string): string {
        return `${this.options.prefix}user:${userId}`;
    }

    /**
     * Add session to user's session set
     */
    private async addUserSession(userId: string, sessionId: string): Promise<void> {
        const userSessionsKey = this.buildUserSessionsKey(userId);
        await this.redisClient.executeCommand('sadd', userSessionsKey, sessionId);
    }

    /**
     * Remove session from user's session set
     */
    private async removeUserSession(userId: string, sessionId: string): Promise<void> {
        const userSessionsKey = this.buildUserSessionsKey(userId);
        await this.redisClient.executeCommand('srem', userSessionsKey, sessionId);
    }

    /**
     * Update last activity timestamp
     */
    private async updateLastActivity(sessionId: string): Promise<void> {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
            await this.updateSession(sessionId, { lastActivity: new Date() });
        }
    }

    /**
     * Enforce session limits per user
     */
    private async enforceSessionLimits(userId: string): Promise<void> {
        const userSessions = await this.getUserSessions(userId);

        if (userSessions.length >= this.options.maxSessionsPerUser) {
            // Remove oldest sessions
            const sortedSessions = userSessions.sort((a, b) =>
                new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime()
            );

            const sessionsToRemove = sortedSessions.slice(0, userSessions.length - this.options.maxSessionsPerUser + 1);

            for (const session of sessionsToRemove) {
                await this.deleteSession(session.sessionId);
            }

            logger.session(`Enforced session limit for user: ${userId}`, 'SessionManager', {
                removed: sessionsToRemove.length,
                maxSessions: this.options.maxSessionsPerUser
            });
        }
    }
}
