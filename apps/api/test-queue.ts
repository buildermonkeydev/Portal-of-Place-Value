/**
 * Test script to verify code submission queue is working
 */
import { RedisClient } from '@repo/redis-lib';
import { QueueClient } from './src/core/infrastructure/QueueClient';
import logger from '@repo/logger';

async function testQueue() {
    console.log('🧪 Testing Code Submission Queue...\n');

    try {
        // Initialize Redis client
        const redisClient = new RedisClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });

        await redisClient.connect();
        console.log('✅ Redis connected');

        // Initialize Queue Client
        const queueClient = new QueueClient(redisClient);
        await queueClient.initialize();
        console.log('✅ Queue client initialized');

        // Test adding a code submission job
        const testSubmissionId = 'test-' + Date.now();
        const testData = {
            submissionId: testSubmissionId,
            testId: 'test-123',
            userId: 'user-123',
            sourceCode: 'function twoSum(nums, target) { return [0, 1]; }',
            languageId: 63, // JavaScript
        };

        console.log('\n📤 Queuing test submission:', testSubmissionId);
        await queueClient.addCodeSubmissionJob(
            testData.submissionId,
            testData.testId,
            testData.userId,
            testData.sourceCode,
            testData.languageId
        );

        console.log('✅ Code submission queued successfully!');

        // Get queue stats
        const stats = await queueClient.getQueueStats('code-submissions-queue');
        console.log('\n📊 Queue Statistics:', stats);

        // Cleanup
        await queueClient.close();
        await redisClient.disconnect();

        console.log('\n✅ Test completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

testQueue();
