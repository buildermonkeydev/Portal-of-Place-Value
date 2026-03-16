import { RedisClient } from '../client/RedisClient';
import { describe, it, jest, expect, beforeEach, afterEach } from "@jest/globals";
import { RedisConfig } from '../client';

// Mock Redis client for testing
const mockRedisInstance = {
    connect: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),
    ping: jest.fn(() => Promise.resolve('PONG')),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    on: jest.fn(),
    isConnected: true,
};

jest.mock('ioredis', () => ({
    Redis: jest.fn().mockImplementation(() => mockRedisInstance),
    Cluster: jest.fn().mockImplementation(() => mockRedisInstance),
}));

describe('RedisClient', () => {
    let redisClient: RedisClient;
    let config: RedisConfig;

    beforeEach(() => {
        config = {
            host: 'localhost',
            port: 6379,
        };
        redisClient = new RedisClient(config);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create RedisClient with default config', () => {
            const client = new RedisClient({});
            expect(client).toBeInstanceOf(RedisClient);
        });

        it('should create RedisClient with custom config', () => {
            const customConfig: RedisConfig = {
                host: 'redis.example.com',
                port: 6380,
                password: 'secret',
            };
            const client = new RedisClient(customConfig);
            expect(client).toBeInstanceOf(RedisClient);
        });
    });

    describe('connect', () => {
        it('should connect to Redis successfully', async () => {
            await expect(redisClient.connect()).resolves.toBeUndefined();
        });

        it('should not connect if already connected', async () => {
            await redisClient.connect();
            await expect(redisClient.connect()).resolves.toBeUndefined();
        });
    });

    describe('disconnect', () => {
        it('should disconnect from Redis successfully', async () => {
            await redisClient.connect();
            await expect(redisClient.disconnect()).resolves.toBeUndefined();
        });
    });

    describe('isClientConnected', () => {
        it('should return false when not connected', () => {
            expect(redisClient.isClientConnected()).toBe(false);
        });

        it('should return true when connected', async () => {
            await redisClient.connect();
            expect(redisClient.isClientConnected()).toBe(true);
        });
    });

    describe('getStats', () => {
        it('should return connection statistics', () => {
            const stats = redisClient.getStats();
            expect(stats).toHaveProperty('connected');
            expect(stats).toHaveProperty('ready');
            expect(stats).toHaveProperty('mode');
            expect(stats).toHaveProperty('totalConnections');
            expect(stats).toHaveProperty('activeConnections');
        });
    });

    describe('ping', () => {
        it('should ping Redis server', async () => {
            await redisClient.connect();
            await expect(redisClient.ping()).resolves.toBe('PONG');
        });
    });
});
