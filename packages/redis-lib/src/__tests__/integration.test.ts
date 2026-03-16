import { RedisLibrary } from '../RedisLibrary';
import { describe, it, jest, expect, beforeAll, afterAll } from "@jest/globals";

describe('Redis Library Integration Tests', () => {
    let redisLibrary: RedisLibrary;

    beforeAll(async () => {
        // Skip if no Redis server available
        if (!process.env.REDIS_URL) {
            console.log('Skipping integration tests - REDIS_URL not set');
            return;
        }

        redisLibrary = new RedisLibrary({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD
            }
        });

        await redisLibrary.initialize();
    });

    afterAll(async () => {
        if (redisLibrary) {
            await redisLibrary.close();
        }
    });

    describe('Cache Integration', () => {
        it('should cache and retrieve data', async () => {
            if (!redisLibrary) return;

            const cache = redisLibrary.getCacheManager();

            // Set cache
            await cache.set('test-key', { name: 'test', value: 123 }, { ttl: 60 });

            // Get cache
            const result = await cache.get('test-key');
            expect(result).toEqual({ name: 'test', value: 123 });

            // Check TTL
            const ttl = await cache.ttl('test-key');
            expect(ttl).toBeGreaterThan(0);
            expect(ttl).toBeLessThanOrEqual(60);

            // Delete cache
            const deleted = await cache.delete('test-key');
            expect(deleted).toBe(true);

            // Verify deletion
            const afterDelete = await cache.get('test-key');
            expect(afterDelete).toBeNull();
        });

        it('should handle batch operations', async () => {
            if (!redisLibrary) return;

            const cache = redisLibrary.getCacheManager();

            // Batch set
            const keyValuePairs = [
                { key: 'batch1', value: 'value1' },
                { key: 'batch2', value: 'value2' },
                { key: 'batch3', value: 'value3' }
            ];

            await cache.mset(keyValuePairs);

            // Batch get
            const results = await cache.mget(['batch1', 'batch2', 'batch3']);
            expect(results).toEqual(['value1', 'value2', 'value3']);

            // Cleanup
            await cache.clear();
        });
    });

    describe('Session Integration', () => {
        it('should manage user sessions', async () => {
            if (!redisLibrary) return;

            const session = redisLibrary.getSessionManager();

            // Create session
            const sessionData = await session.createSession(
                'user123',
                'session456',
                'Mozilla/5.0...',
                '192.168.1.1',
                { theme: 'dark' }
            );

            expect(sessionData.userId).toBe('user123');
            expect(sessionData.sessionId).toBe('session456');

            // Get session
            const retrieved = await session.getSession('session456');
            expect(retrieved).toMatchObject({
                userId: 'user123',
                sessionId: 'session456',
                userAgent: 'Mozilla/5.0...',
                ipAddress: '192.168.1.1',
                data: { theme: 'dark' }
            });

            // Update session
            await session.updateSession('session456', { data: { theme: 'light' } });

            const updated = await session.getSession('session456');
            expect(updated?.data).toEqual({ theme: 'light' });

            // Get user sessions
            const userSessions = await session.getUserSessions('user123');
            expect(userSessions).toHaveLength(1);

            // Delete session
            const deleted = await session.deleteSession('session456');
            expect(deleted).toBe(true);

            // Verify deletion
            const afterDelete = await session.getSession('session456');
            expect(afterDelete).toBeNull();
        });
    });


    describe('Pub/Sub Integration', () => {
        it('should handle pub/sub messaging', async () => {
            if (!redisLibrary) return;

            const pubsub = redisLibrary.getPubSubManager();

            // Subscribe to channel
            const messages: any[] = [];
            await pubsub.subscribe('test-channel', (channel, message) => {
                messages.push({ channel, message });
            });

            // Publish message
            await pubsub.publish('test-channel', { type: 'test', data: 'hello' });

            // Wait for message
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(messages).toHaveLength(1);
            expect(messages[0]).toEqual({
                channel: 'test-channel',
                message: { type: 'test', data: 'hello' }
            });

            // Unsubscribe
            await pubsub.unsubscribe('test-channel');
        });

        it('should handle pattern subscriptions', async () => {
            if (!redisLibrary) return;

            const pubsub = redisLibrary.getPubSubManager();

            // Subscribe to pattern
            const messages: any[] = [];
            await pubsub.subscribe('test-*', (channel, message) => {
                messages.push({ channel, message });
            }, { pattern: true });

            // Publish to matching channel
            await pubsub.publish('test-pattern', { type: 'pattern', data: 'match' });

            // Wait for message
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(messages).toHaveLength(1);
            expect(messages[0].channel).toBe('test-pattern');
            expect(messages[0].message).toEqual({ type: 'pattern', data: 'match' });

            // Unsubscribe
            await pubsub.unsubscribe('test-*');
        });
    });

    describe('Health Check Integration', () => {
        it('should perform health check', async () => {
            if (!redisLibrary) return;

            const health = await redisLibrary.healthCheck();

            expect(health.status).toBe('healthy');
            expect(health.details.redis).toBe(true);
            expect(health.timestamp).toBeDefined();
        });
    });

    describe('Statistics Integration', () => {
        it('should collect comprehensive statistics', async () => {
            if (!redisLibrary) return;

            const stats = await redisLibrary.getStats();

            expect(stats.redis).toHaveProperty('connected');
            expect(stats.cache).toHaveProperty('hits');
            expect(stats.session).toHaveProperty('totalSessions');
            expect(stats.pubsub).toHaveProperty('totalSubscriptions');
        });
    });
});
