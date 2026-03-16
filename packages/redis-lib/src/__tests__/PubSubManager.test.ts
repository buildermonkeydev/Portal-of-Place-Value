import { PubSubManager } from '../pubsub/PubSubManager';
import { RedisClient } from '../client/RedisClient';
import { describe, it, jest, expect, beforeEach } from "@jest/globals";

// Mock Redis client
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

// Mock Redis client instances for publisher and subscriber
const mockPublisher = {
    publish: jest.fn(() => Promise.resolve(1)),
    quit: jest.fn(() => Promise.resolve())
};

const mockSubscriber = {
    subscribe: jest.fn(() => Promise.resolve()),
    unsubscribe: jest.fn(() => Promise.resolve()),
    psubscribe: jest.fn(() => Promise.resolve()),
    punsubscribe: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),
    on: jest.fn()
};

describe('PubSubManager', () => {
    let pubSubManager: PubSubManager;
    let redisClient: jest.Mocked<RedisClient>;

    beforeEach(() => {
        redisClient = mockRedisClient as any;
        redisClient.getClient.mockReturnValue(mockPublisher as any);
        pubSubManager = new PubSubManager(redisClient);
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create PubSubManager', () => {
            expect(pubSubManager).toBeInstanceOf(PubSubManager);
        });
    });

    describe('initialize', () => {
        it('should initialize pub/sub clients', async () => {
            redisClient.getClient.mockReturnValueOnce(mockPublisher as any);
            redisClient.getClient.mockReturnValueOnce(mockSubscriber as any);

            await pubSubManager.initialize();

            expect(mockSubscriber.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockSubscriber.on).toHaveBeenCalledWith('pmessage', expect.any(Function));
        });

        it('should throw error if Redis client not available', async () => {
            redisClient.getClient.mockReturnValue(null);

            await expect(pubSubManager.initialize()).rejects.toThrow('Redis client not available');
        });
    });

    describe('publish', () => {
        beforeEach(async () => {
            redisClient.getClient.mockReturnValueOnce(mockPublisher as any);
            redisClient.getClient.mockReturnValueOnce(mockSubscriber as any);
            await pubSubManager.initialize();
        });

        it('should publish message to channel', async () => {
            mockPublisher.publish.mockImplementation(() => Promise.resolve(3));

            const result = await pubSubManager.publish('test-channel', { message: 'test' });

            expect(result).toBe(3);
            expect(mockPublisher.publish).toHaveBeenCalledWith('test-channel', JSON.stringify({ message: 'test' }));
        });

        it('should handle publish errors', async () => {
            mockPublisher.publish.mockImplementation(() => Promise.reject(new Error('Publish failed')));

            await expect(pubSubManager.publish('test-channel', 'test')).rejects.toThrow('Publish failed');
        });
    });

    describe('subscribe', () => {
        beforeEach(async () => {
            redisClient.getClient.mockReturnValueOnce(mockPublisher as any);
            redisClient.getClient.mockReturnValueOnce(mockSubscriber as any);
            await pubSubManager.initialize();
        });

        it('should subscribe to exact channel', async () => {
            const handler = jest.fn() as any;
            mockSubscriber.subscribe.mockImplementation(() => Promise.resolve());

            await pubSubManager.subscribe('test-channel', handler);

            expect(mockSubscriber.subscribe).toHaveBeenCalledWith('test-channel');
        });

        it('should subscribe to pattern channel', async () => {
            const handler = jest.fn() as any;
            mockSubscriber.psubscribe.mockImplementation(() => Promise.resolve());

            await pubSubManager.subscribe('test-*', handler, { pattern: true });

            expect(mockSubscriber.psubscribe).toHaveBeenCalledWith('test-*');
        });

        it('should handle subscription errors', async () => {
            const handler = jest.fn() as any;
            mockSubscriber.subscribe.mockImplementation(() => Promise.reject(new Error('Subscribe failed')));

            await expect(pubSubManager.subscribe('test-channel', handler)).rejects.toThrow('Subscribe failed');
        });
    });

    describe('unsubscribe', () => {
        beforeEach(async () => {
            redisClient.getClient.mockReturnValueOnce(mockPublisher as any);
            redisClient.getClient.mockReturnValueOnce(mockSubscriber as any);
            await pubSubManager.initialize();
        });

        it('should unsubscribe from exact channel', async () => {
            mockSubscriber.unsubscribe.mockImplementation(() => Promise.resolve());

            await pubSubManager.unsubscribe('test-channel');

            expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith('test-channel');
        });

        it('should unsubscribe from pattern channel', async () => {
            mockSubscriber.punsubscribe.mockImplementation(() => Promise.resolve());

            await pubSubManager.unsubscribe('test-*');

            expect(mockSubscriber.punsubscribe).toHaveBeenCalledWith('test-*');
        });

        it('should unsubscribe specific handler', async () => {
            const handler1 = jest.fn() as any;
            const handler2 = jest.fn() as any;

            // Subscribe with two handlers
            await pubSubManager.subscribe('test-channel', handler1);
            await pubSubManager.subscribe('test-channel', handler2);

            // Unsubscribe only handler1
            await pubSubManager.unsubscribe('test-channel', handler1);

            // Should not call unsubscribe on Redis client since other handlers exist
            expect(mockSubscriber.unsubscribe).not.toHaveBeenCalled();
        });
    });

    describe('publishToChannels', () => {
        beforeEach(async () => {
            redisClient.getClient.mockReturnValueOnce(mockPublisher as any);
            redisClient.getClient.mockReturnValueOnce(mockSubscriber as any);
            await pubSubManager.initialize();
        });

        it('should publish to multiple channels', async () => {
            let callCount = 0;
            mockPublisher.publish.mockImplementation(() => {
                const values = [2, 1, 0];
                return Promise.resolve(values[callCount++]);
            });

            const result = await pubSubManager.publishToChannels(
                ['channel1', 'channel2', 'channel3'],
                { message: 'test' }
            );

            expect(result).toEqual({
                channel1: 2,
                channel2: 1,
                channel3: 0
            });
        });

        it('should handle errors for individual channels', async () => {
            let callCount = 0;
            mockPublisher.publish.mockImplementation(() => {
                const results = [Promise.resolve(2), Promise.reject(new Error('Publish failed')), Promise.resolve(1)];
                return results[callCount++];
            });

            const result = await pubSubManager.publishToChannels(
                ['channel1', 'channel2', 'channel3'],
                { message: 'test' }
            );

            expect(result).toEqual({
                channel1: 2,
                channel2: 0,
                channel3: 1
            });
        });
    });

    describe('getActiveChannels', () => {
        it('should return active channels', () => {
            // Manually add channels to internal maps
            (pubSubManager as any).handlers.set('channel1', [jest.fn()]);
            (pubSubManager as any).handlers.set('channel2', [jest.fn()]);
            (pubSubManager as any).patternHandlers.set('pattern-*', [jest.fn()]);

            const channels = pubSubManager.getActiveChannels();

            expect(channels).toContain('channel1');
            expect(channels).toContain('channel2');
            expect(channels).toContain('pattern-*');
        });
    });

    describe('getSubscriptionCount', () => {
        it('should return subscription count for channel', () => {
            // Manually add handlers
            (pubSubManager as any).handlers.set('channel1', [jest.fn(), jest.fn()]);
            (pubSubManager as any).patternHandlers.set('pattern-*', [jest.fn()]);

            const count = pubSubManager.getSubscriptionCount('channel1');

            expect(count).toBe(2);
        });
    });

    describe('getStats', () => {
        it('should return pub/sub statistics', () => {
            const stats = pubSubManager.getStats();

            expect(stats).toHaveProperty('totalSubscriptions');
            expect(stats).toHaveProperty('activeChannels');
            expect(stats).toHaveProperty('messagesPublished');
            expect(stats).toHaveProperty('messagesReceived');
            expect(stats).toHaveProperty('errors');
        });
    });

    describe('resetStats', () => {
        it('should reset statistics', () => {
            pubSubManager.resetStats();
            const stats = pubSubManager.getStats();

            expect(stats.totalSubscriptions).toBe(0);
            expect(stats.activeChannels).toBe(0);
            expect(stats.messagesPublished).toBe(0);
            expect(stats.messagesReceived).toBe(0);
            expect(stats.errors).toBe(0);
        });
    });

    describe('close', () => {
        it('should close pub/sub connections', async () => {
            redisClient.getClient.mockReturnValueOnce(mockPublisher as any);
            redisClient.getClient.mockReturnValueOnce(mockSubscriber as any);
            await pubSubManager.initialize();

            mockSubscriber.quit.mockImplementation(() => Promise.resolve());
            mockPublisher.quit.mockImplementation(() => Promise.resolve());

            await pubSubManager.close();

            expect(mockSubscriber.quit).toHaveBeenCalled();
            expect(mockPublisher.quit).toHaveBeenCalled();
        });
    });

    describe('message handling', () => {
        beforeEach(async () => {
            redisClient.getClient.mockReturnValueOnce(mockPublisher as any);
            redisClient.getClient.mockReturnValueOnce(mockSubscriber as any);
            await pubSubManager.initialize();
        });

        it('should handle incoming messages', async () => {
            const handler = jest.fn() as any;
            await pubSubManager.subscribe('test-channel', handler);

            // Simulate message event
            const messageHandler = mockSubscriber.on.mock.calls.find(
                call => call[0] === 'message'
            )?.[1] as any;

            if (messageHandler) {
                await messageHandler('test-channel', JSON.stringify({ message: 'test' }));
                expect(handler).toHaveBeenCalledWith('test-channel', { message: 'test' });
            }
        });

        it('should handle pattern messages', async () => {
            const handler = jest.fn() as any;
            await pubSubManager.subscribe('test-*', handler, { pattern: true });

            // Simulate pattern message event
            const patternMessageHandler = mockSubscriber.on.mock.calls.find(
                call => call[0] === 'pmessage'
            )?.[1] as any;

            if (patternMessageHandler) {
                await patternMessageHandler('test-*', 'test-channel', JSON.stringify({ message: 'test' }));
                expect(handler).toHaveBeenCalledWith('test-channel', { message: 'test' });
            }
        });

        it('should handle handler errors gracefully', async () => {
            const handler = jest.fn().mockImplementation(() => Promise.reject(new Error('Handler error'))) as any;
            await pubSubManager.subscribe('test-channel', handler);

            const messageHandler = mockSubscriber.on.mock.calls.find(
                call => call[0] === 'message'
            )?.[1] as any;

            if (messageHandler) {
                // Should not throw
                await expect(messageHandler('test-channel', 'test')).resolves.toBeUndefined();
            }
        });
    });
});
