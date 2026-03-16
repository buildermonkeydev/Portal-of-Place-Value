import { SessionManager } from '../session/SessionManager';
import { RedisClient } from '../client/RedisClient';
import { describe, it, jest, expect, beforeEach } from "@jest/globals";

const mockRedisClient = {
    executeCommand: jest.fn(),
    isClientConnected: jest.fn().mockReturnValue(true),
    getClient: jest.fn(),
    getStats: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    ping: jest.fn(),
    info: jest.fn(),
    memoryUsage: jest.fn(),
    dbSize: jest.fn(),
    flushAll: jest.fn(),
    flushDb: jest.fn()
};

describe('SessionManager', () => {
    let sessionManager: SessionManager;
    let redisClient: jest.Mocked<RedisClient>;

    beforeEach(() => {
        redisClient = mockRedisClient as any;
        sessionManager = new SessionManager(redisClient, {
            ttl: 3600,
            prefix: 'session:',
            maxSessionsPerUser: 3
        });
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create SessionManager with default options', () => {
            const session = new SessionManager(redisClient);
            expect(session).toBeInstanceOf(SessionManager);
        });

        it('should create SessionManager with custom options', () => {
            const options = {
                ttl: 1800,
                prefix: 'custom:',
                maxSessionsPerUser: 5
            };
            const session = new SessionManager(redisClient, options);
            expect(session).toBeInstanceOf(SessionManager);
        });
    });

    describe('createSession', () => {
        it('should create a new session', async () => {
            redisClient.executeCommand.mockResolvedValue('OK');

            const sessionData = await sessionManager.createSession(
                'user123',
                'session456',
                'Mozilla/5.0...',
                '192.168.1.1',
                { theme: 'dark' }
            );

            expect(sessionData).toMatchObject({
                userId: 'user123',
                sessionId: 'session456',
                userAgent: 'Mozilla/5.0...',
                ipAddress: '192.168.1.1',
                data: { theme: 'dark' }
            });
            expect(sessionData.createdAt).toBeInstanceOf(Date);
            expect(sessionData.lastActivity).toBeInstanceOf(Date);
            expect(sessionData.expiresAt).toBeInstanceOf(Date);
        });

        it('should enforce session limits', async () => {
            // Mock existing sessions
            redisClient.executeCommand
                .mockResolvedValueOnce('OK') // setex for session data
                .mockResolvedValueOnce(1) // sadd for user session
                .mockResolvedValueOnce(['session1', 'session2', 'session3']) // smembers for existing sessions
                .mockResolvedValueOnce(JSON.stringify({ // get for session1
                    userId: 'user123',
                    sessionId: 'session1',
                    createdAt: new Date(Date.now() - 10000),
                    lastActivity: new Date(Date.now() - 10000),
                    expiresAt: new Date(Date.now() + 3600000)
                }))
                .mockResolvedValueOnce('OK') // del for session1
                .mockResolvedValueOnce(1) // srem for session1
                .mockResolvedValueOnce('OK') // setex for new session
                .mockResolvedValueOnce(1); // sadd for new session

            await sessionManager.createSession('user123', 'session456');

            expect(redisClient.executeCommand).toHaveBeenCalledWith('del', 'session:session1');
        });
    });

    describe('getSession', () => {
        it('should get existing session', async () => {
            const sessionData = {
                userId: 'user123',
                sessionId: 'session456',
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 3600000),
                data: { theme: 'dark' }
            };

            redisClient.executeCommand
                .mockResolvedValueOnce(JSON.stringify(sessionData))
                .mockResolvedValueOnce('OK'); // Update last activity

            const result = await sessionManager.getSession('session456');

            expect(result).toMatchObject({
                userId: 'user123',
                sessionId: 'session456',
                data: { theme: 'dark' }
            });
        });

        it('should return null for non-existent session', async () => {
            redisClient.executeCommand.mockResolvedValue(null);

            const result = await sessionManager.getSession('nonexistent');

            expect(result).toBeNull();
        });

        it('should return null for expired session', async () => {
            const expiredSession = {
                userId: 'user123',
                sessionId: 'session456',
                createdAt: new Date(Date.now() - 7200000),
                lastActivity: new Date(Date.now() - 7200000),
                expiresAt: new Date(Date.now() - 3600000), // Expired
                data: {}
            };

            redisClient.executeCommand
                .mockResolvedValueOnce(JSON.stringify(expiredSession))
                .mockResolvedValueOnce('OK') // del for expired session
                .mockResolvedValueOnce(1); // srem for expired session

            const result = await sessionManager.getSession('session456');

            expect(result).toBeNull();
        });
    });

    describe('updateSession', () => {
        it('should update existing session', async () => {
            const sessionData = {
                userId: 'user123',
                sessionId: 'session456',
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 3600000),
                data: {}
            };

            redisClient.executeCommand
                .mockResolvedValueOnce(JSON.stringify(sessionData))
                .mockResolvedValueOnce('OK');

            const result = await sessionManager.updateSession('session456', {
                data: { theme: 'light' }
            });

            expect(result).toBe(true);
        });

        it('should return false for non-existent session', async () => {
            redisClient.executeCommand.mockResolvedValue(null);

            const result = await sessionManager.updateSession('nonexistent', {
                data: { theme: 'light' }
            });

            expect(result).toBe(false);
        });
    });

    describe('deleteSession', () => {
        it('should delete existing session', async () => {
            const sessionData = {
                userId: 'user123',
                sessionId: 'session456',
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 3600000),
                data: {}
            };

            redisClient.executeCommand
                .mockResolvedValueOnce(JSON.stringify(sessionData))
                .mockResolvedValueOnce('OK') // del session data
                .mockResolvedValueOnce(1); // srem from user sessions

            const result = await sessionManager.deleteSession('session456');

            expect(result).toBe(true);
        });

        it('should return false for non-existent session', async () => {
            redisClient.executeCommand.mockResolvedValue(null);

            const result = await sessionManager.deleteSession('nonexistent');

            expect(result).toBe(false);
        });
    });

    describe('deleteUserSessions', () => {
        it('should delete all sessions for user', async () => {
            redisClient.executeCommand
                .mockResolvedValueOnce(['session1', 'session2']) // smembers
                .mockResolvedValueOnce(2) // del session data
                .mockResolvedValueOnce(1); // del user sessions

            const result = await sessionManager.deleteUserSessions('user123');

            expect(result).toBe(2);
        });

        it('should return 0 for user with no sessions', async () => {
            redisClient.executeCommand.mockResolvedValue([]);

            const result = await sessionManager.deleteUserSessions('user123');

            expect(result).toBe(0);
        });
    });

    describe('getUserSessions', () => {
        it('should get all sessions for user', async () => {
            const sessionData = {
                userId: 'user123',
                sessionId: 'session456',
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 3600000),
                data: {}
            };

            redisClient.executeCommand
                .mockResolvedValueOnce(['session456']) // smembers
                .mockResolvedValueOnce(JSON.stringify(sessionData)); // get session data

            const result = await sessionManager.getUserSessions('user123');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                userId: 'user123',
                sessionId: 'session456'
            });
        });
    });

    describe('cleanupExpiredSessions', () => {
        it('should clean up expired sessions', async () => {
            const expiredSession = {
                userId: 'user123',
                sessionId: 'session456',
                createdAt: new Date(Date.now() - 7200000),
                lastActivity: new Date(Date.now() - 7200000),
                expiresAt: new Date(Date.now() - 3600000), // Expired
                data: {}
            };

            redisClient.executeCommand
                .mockResolvedValueOnce(['session:session456']) // keys
                .mockResolvedValueOnce(JSON.stringify(expiredSession)) // get
                .mockResolvedValueOnce('OK') // del
                .mockResolvedValueOnce(1); // srem

            const result = await sessionManager.cleanupExpiredSessions();

            expect(result).toBe(1);
        });
    });

    describe('getStats', () => {
        it('should return session statistics', async () => {
            const sessionData = {
                userId: 'user123',
                sessionId: 'session456',
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 3600000),
                data: {}
            };

            redisClient.executeCommand
                .mockResolvedValueOnce(['session:session456']) // keys
                .mockResolvedValueOnce(JSON.stringify(sessionData)); // get

            const result = await sessionManager.getStats();

            expect(result).toHaveProperty('totalSessions');
            expect(result).toHaveProperty('activeSessions');
            expect(result).toHaveProperty('expiredSessions');
            expect(result).toHaveProperty('userSessions');
        });
    });

    describe('extendSession', () => {
        it('should extend session TTL', async () => {
            const sessionData = {
                userId: 'user123',
                sessionId: 'session456',
                createdAt: new Date(),
                lastActivity: new Date(),
                expiresAt: new Date(Date.now() + 3600000),
                data: {}
            };

            redisClient.executeCommand
                .mockResolvedValueOnce(JSON.stringify(sessionData)) // get session
                .mockResolvedValueOnce('OK') // expire
                .mockResolvedValueOnce(JSON.stringify(sessionData)) // get session again
                .mockResolvedValueOnce('OK'); // update session

            const result = await sessionManager.extendSession('session456', 7200);

            expect(result).toBe(true);
        });

        it('should return false for non-existent session', async () => {
            redisClient.executeCommand.mockResolvedValue(null);

            const result = await sessionManager.extendSession('nonexistent');

            expect(result).toBe(false);
        });
    });
});
