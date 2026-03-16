import { RedisLibrary } from '../RedisLibrary';
import { RedisClient } from '../client/RedisClient';
import { CacheManager } from '../cache/CacheManager';
import { SessionManager } from '../session/SessionManager';
import { PubSubManager } from '../pubsub/PubSubManager';
import { describe, it, jest, expect, beforeEach } from "@jest/globals";

// Mock all dependencies
jest.mock('../client/RedisClient');
jest.mock('../cache/CacheManager');
jest.mock('../session/SessionManager');
jest.mock('../pubsub/PubSubManager');

describe('RedisLibrary', () => {
    let redisLibrary: RedisLibrary;
    let mockRedisClient: jest.Mocked<RedisClient>;
    let mockCacheManager: jest.Mocked<CacheManager>;
    let mockSessionManager: jest.Mocked<SessionManager>;
    let mockPubSubManager: jest.Mocked<PubSubManager>;

    const config = {
        redis: {
            host: 'localhost',
            port: 6379
        },
        cache: {
            ttl: 3600,
            prefix: 'test:'
        },
        session: {
            ttl: 86400,
            maxSessionsPerUser: 5
        }
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock instances
        mockRedisClient = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            isClientConnected: jest.fn().mockReturnValue(true),
            getClient: jest.fn(),
            getStats: jest.fn(),
            ping: jest.fn(),
            info: jest.fn(),
            memoryUsage: jest.fn(),
            dbSize: jest.fn(),
            flushAll: jest.fn(),
            flushDb: jest.fn(),
            executeCommand: jest.fn()
        } as any;

        mockCacheManager = {
            getStats: jest.fn().mockReturnValue({
                hits: 10,
                misses: 5,
                sets: 15,
                deletes: 2,
                hitRate: 66.67
            })
        } as any;

        mockSessionManager = {
            getStats: jest.fn(() => Promise.resolve({
                totalSessions: 100,
                activeSessions: 50,
                expiredSessions: 10,
                userSessions: { 'user1': 2, 'user2': 1 }
            })),
            cleanupExpiredSessions: jest.fn(() => Promise.resolve(5))
        } as any;



        mockPubSubManager = {
            initialize: jest.fn(() => Promise.resolve()),
            close: jest.fn(() => Promise.resolve()),
            getStats: jest.fn(() => ({
                totalSubscriptions: 10,
                activeChannels: 5,
                messagesPublished: 1000,
                messagesReceived: 950,
                errors: 2
            }))
        } as any;

        // Mock constructors
        (RedisClient as jest.Mock).mockImplementation(() => mockRedisClient);
        (CacheManager as jest.Mock).mockImplementation(() => mockCacheManager);
        (SessionManager as jest.Mock).mockImplementation(() => mockSessionManager);
        (PubSubManager as jest.Mock).mockImplementation(() => mockPubSubManager);

        redisLibrary = new RedisLibrary(config);
    });

    describe('constructor', () => {
        it('should create RedisLibrary with config', () => {
            expect(redisLibrary).toBeInstanceOf(RedisLibrary);
            expect(RedisClient).toHaveBeenCalledWith(config.redis);
            expect(CacheManager).toHaveBeenCalledWith(mockRedisClient, config.cache);
            expect(SessionManager).toHaveBeenCalledWith(mockRedisClient, config.session);
            expect(PubSubManager).toHaveBeenCalledWith(mockRedisClient);
        });
    });

    describe('initialize', () => {
        it('should initialize all components', async () => {
            await redisLibrary.initialize();

            expect(mockRedisClient.connect).toHaveBeenCalled();
            expect(mockPubSubManager.initialize).toHaveBeenCalled();
        });

        it('should handle initialization errors', async () => {
            mockRedisClient.connect.mockImplementation(() => Promise.reject(new Error('Connection failed')));

            await expect(redisLibrary.initialize()).rejects.toThrow('Connection failed');
        });
    });

    describe('close', () => {
        it('should close all connections', async () => {
            await redisLibrary.close();

            expect(mockPubSubManager.close).toHaveBeenCalled();
            expect(mockRedisClient.disconnect).toHaveBeenCalled();
        });

        it('should handle close errors', async () => {
            mockRedisClient.disconnect.mockImplementation(() => Promise.reject(new Error('Disconnect failed')));

            await expect(redisLibrary.close()).rejects.toThrow('Disconnect failed');
        });
    });

    describe('isReady', () => {
        it('should return true when initialized and connected', async () => {
            await redisLibrary.initialize();
            mockRedisClient.isClientConnected.mockReturnValue(true);

            expect(redisLibrary.isReady()).toBe(true);
        });

        it('should return false when not initialized', () => {
            expect(redisLibrary.isReady()).toBe(false);
        });

        it('should return false when not connected', async () => {
            await redisLibrary.initialize();
            mockRedisClient.isClientConnected.mockReturnValue(false);

            expect(redisLibrary.isReady()).toBe(false);
        });
    });

    describe('getters', () => {
        it('should return Redis client', () => {
            const client = redisLibrary.getRedisClient();
            expect(client).toBe(mockRedisClient);
        });

        it('should return cache manager', () => {
            const cache = redisLibrary.getCacheManager();
            expect(cache).toBe(mockCacheManager);
        });

        it('should return session manager', () => {
            const session = redisLibrary.getSessionManager();
            expect(session).toBe(mockSessionManager);
        });

        it('should return pub/sub manager', () => {
            const pubsub = redisLibrary.getPubSubManager();
            expect(pubsub).toBe(mockPubSubManager);
        });
    });

    describe('getStats', () => {
        it('should return comprehensive statistics', async () => {
            const redisStats = {
                connected: true,
                ready: true,
                mode: 'standalone' as const,
                totalConnections: 1,
                activeConnections: 1,
                uptime: 3600
            };

            mockRedisClient.getStats.mockReturnValue(redisStats);

            const stats = await redisLibrary.getStats();

            expect(stats).toEqual({
                redis: redisStats,
                cache: {
                    hits: 10,
                    misses: 5,
                    sets: 15,
                    deletes: 2,
                    hitRate: 66.67
                },
                session: {
                    totalSessions: 100,
                    activeSessions: 50,
                    expiredSessions: 10,
                    userSessions: { 'user1': 2, 'user2': 1 }
                },
                pubsub: {
                    totalSubscriptions: 10,
                    activeChannels: 5,
                    messagesPublished: 1000,
                    messagesReceived: 950,
                    errors: 2
                }
            });
        });

        it('should handle stats errors', async () => {
            mockRedisClient.getStats.mockImplementation(() => {
                throw new Error('Stats failed');
            });

            await expect(redisLibrary.getStats()).rejects.toThrow('Stats failed');
        });
    });

    describe('healthCheck', () => {
        it('should return healthy status when all components are working', async () => {
            await redisLibrary.initialize();
            mockRedisClient.isClientConnected.mockReturnValue(true);

            const health = await redisLibrary.healthCheck();

            expect(health.status).toBe('healthy');
            expect(health.details).toEqual({
                redis: true,
                cache: true,
                session: true,
                pubsub: true
            });
        });

        it('should return unhealthy status when Redis is not connected', async () => {
            await redisLibrary.initialize();
            mockRedisClient.isClientConnected.mockReturnValue(false);

            const health = await redisLibrary.healthCheck();

            expect(health.status).toBe('unhealthy');
            expect(health.details.redis).toBe(false);
        });

        it('should return unhealthy status when not initialized', async () => {
            // Ensure Redis client is not connected
            mockRedisClient.isClientConnected.mockReturnValue(false);

            const health = await redisLibrary.healthCheck();

            expect(health.status).toBe('unhealthy');
            expect(health.details).toEqual({
                redis: false,
                cache: false,
                session: false,
                pubsub: false
            });
        });

        it('should handle health check errors', async () => {
            mockRedisClient.isClientConnected.mockImplementation(() => {
                throw new Error('Health check failed');
            });

            const health = await redisLibrary.healthCheck();

            expect(health.status).toBe('unhealthy');
        });
    });

    describe('cleanup', () => {
        it('should cleanup expired data', async () => {
            const result = await redisLibrary.cleanup();

            expect(mockSessionManager.cleanupExpiredSessions).toHaveBeenCalled();
            expect(result).toEqual({
                sessions: 5,
            });
        });

        it('should handle cleanup errors', async () => {
            mockSessionManager.cleanupExpiredSessions.mockImplementation(() => Promise.reject(new Error('Cleanup failed')));

            await expect(redisLibrary.cleanup()).rejects.toThrow('Cleanup failed');
        });
    });
});
