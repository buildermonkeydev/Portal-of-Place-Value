import { CacheService } from '../core/infrastructure/Cache';
import { TEST_CACHE_KEYS } from '../shared/constants/test-cache-keys';
import { TestResponseDto } from '../apps/test/dto/test.dto';
import { Logger } from '@repo/logger';

const logger = new Logger();

export class TestCachedService {
    private cacheService: CacheService;

    constructor() {
        this.cacheService = new CacheService();
    }

    /**
     * Get test by ID from cache
     */
    async getTest(testId: string): Promise<TestResponseDto | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_ID(testId);
            return await this.cacheService.get<TestResponseDto>(key);
        } catch (error) {
            logger.error('Failed to get test from cache', 'TestCachedService', { testId, error });
            return null;
        }
    }

    /**
     * Set test in cache
     */
    async setTest(testId: string, test: TestResponseDto, ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_ID(testId);
            await this.cacheService.set(key, test, { ttl });
            logger.debug('Test cached successfully', 'TestCachedService', { testId });
        } catch (error) {
            logger.error('Failed to cache test', 'TestCachedService', { testId, error });
        }
    }

    /**
     * Get test list from cache
     */
    async getTestList(filters: string): Promise<TestResponseDto[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_LIST(filters);
            return await this.cacheService.get<TestResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get test list from cache', 'TestCachedService', { filters, error });
            return null;
        }
    }

    /**
     * Set test list in cache
     */
    async setTestList(filters: string, tests: TestResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_LIST(filters);
            await this.cacheService.set(key, tests, { ttl });
            logger.debug('Test list cached successfully', 'TestCachedService', { filters, count: tests.length });
        } catch (error) {
            logger.error('Failed to cache test list', 'TestCachedService', { filters, error });
        }
    }

    /**
     * Get test questions from cache
     */
    async getTestQuestions(testId: string): Promise<any[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_QUESTIONS(testId);
            return await this.cacheService.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get test questions from cache', 'TestCachedService', { testId, error });
            return null;
        }
    }

    /**
     * Set test questions in cache
     */
    async setTestQuestions(testId: string, questions: any[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_QUESTIONS(testId);
            await this.cacheService.set(key, questions, { ttl });
            logger.debug('Test questions cached successfully', 'TestCachedService', { testId, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache test questions', 'TestCachedService', { testId, error });
        }
    }

    /**
     * Get test stats from cache
     */
    async getTestStats(testId: string): Promise<any | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_STATS(testId);
            return await this.cacheService.get<any>(key);
        } catch (error) {
            logger.error('Failed to get test stats from cache', 'TestCachedService', { testId, error });
            return null;
        }
    }

    /**
     * Set test stats in cache
     */
    async setTestStats(testId: string, stats: any, ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_STATS(testId);
            await this.cacheService.set(key, stats, { ttl });
            logger.debug('Test stats cached successfully', 'TestCachedService', { testId });
        } catch (error) {
            logger.error('Failed to cache test stats', 'TestCachedService', { testId, error });
        }
    }

    /**
     * Get test results from cache
     */
    async getTestResults(testId: string): Promise<any[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_RESULTS(testId);
            return await this.cacheService.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get test results from cache', 'TestCachedService', { testId, error });
            return null;
        }
    }

    /**
     * Set test results in cache
     */
    async setTestResults(testId: string, results: any[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_RESULTS(testId);
            await this.cacheService.set(key, results, { ttl });
            logger.debug('Test results cached successfully', 'TestCachedService', { testId, count: results.length });
        } catch (error) {
            logger.error('Failed to cache test results', 'TestCachedService', { testId, error });
        }
    }

    /**
     * Get tests by college from cache
     */
    async getTestsByCollege(collegeId: string): Promise<TestResponseDto[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_COLLEGE(collegeId);
            return await this.cacheService.get<TestResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get tests by college from cache', 'TestCachedService', { collegeId, error });
            return null;
        }
    }

    /**
     * Set tests by college in cache
     */
    async setTestsByCollege(collegeId: string, tests: TestResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_COLLEGE(collegeId);
            await this.cacheService.set(key, tests, { ttl });
            logger.debug('Tests by college cached successfully', 'TestCachedService', { collegeId, count: tests.length });
        } catch (error) {
            logger.error('Failed to cache tests by college', 'TestCachedService', { collegeId, error });
        }
    }

    /**
     * Get tests by course from cache
     */
    async getTestsByCourse(courseId: string): Promise<TestResponseDto[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_COURSE(courseId);
            return await this.cacheService.get<TestResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get tests by course from cache', 'TestCachedService', { courseId, error });
            return null;
        }
    }

    /**
     * Set tests by course in cache
     */
    async setTestsByCourse(courseId: string, tests: TestResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_COURSE(courseId);
            await this.cacheService.set(key, tests, { ttl });
            logger.debug('Tests by course cached successfully', 'TestCachedService', { courseId, count: tests.length });
        } catch (error) {
            logger.error('Failed to cache tests by course', 'TestCachedService', { courseId, error });
        }
    }

    /**
     * Get tests by status from cache
     */
    async getTestsByStatus(status: string): Promise<TestResponseDto[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_STATUS(status);
            return await this.cacheService.get<TestResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get tests by status from cache', 'TestCachedService', { status, error });
            return null;
        }
    }

    /**
     * Set tests by status in cache
     */
    async setTestsByStatus(status: string, tests: TestResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_STATUS(status);
            await this.cacheService.set(key, tests, { ttl });
            logger.debug('Tests by status cached successfully', 'TestCachedService', { status, count: tests.length });
        } catch (error) {
            logger.error('Failed to cache tests by status', 'TestCachedService', { status, error });
        }
    }

    /**
     * Get tests by difficulty from cache
     */
    async getTestsByDifficulty(difficulty: string): Promise<TestResponseDto[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_DIFFICULTY(difficulty);
            return await this.cacheService.get<TestResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get tests by difficulty from cache', 'TestCachedService', { difficulty, error });
            return null;
        }
    }

    /**
     * Set tests by difficulty in cache
     */
    async setTestsByDifficulty(difficulty: string, tests: TestResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_BY_DIFFICULTY(difficulty);
            await this.cacheService.set(key, tests, { ttl });
            logger.debug('Tests by difficulty cached successfully', 'TestCachedService', { difficulty, count: tests.length });
        } catch (error) {
            logger.error('Failed to cache tests by difficulty', 'TestCachedService', { difficulty, error });
        }
    }

    /**
     * Get test submissions from cache
     */
    async getTestSubmissions(testId: string): Promise<any[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_SUBMISSIONS(testId);
            return await this.cacheService.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get test submissions from cache', 'TestCachedService', { testId, error });
            return null;
        }
    }

    /**
     * Set test submissions in cache
     */
    async setTestSubmissions(testId: string, submissions: any[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_SUBMISSIONS(testId);
            await this.cacheService.set(key, submissions, { ttl });
            logger.debug('Test submissions cached successfully', 'TestCachedService', { testId, count: submissions.length });
        } catch (error) {
            logger.error('Failed to cache test submissions', 'TestCachedService', { testId, error });
        }
    }

    /**
     * Get test leaderboard from cache
     */
    async getTestLeaderboard(testId: string): Promise<any[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_LEADERBOARD(testId);
            return await this.cacheService.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get test leaderboard from cache', 'TestCachedService', { testId, error });
            return null;
        }
    }

    /**
     * Set test leaderboard in cache
     */
    async setTestLeaderboard(testId: string, leaderboard: any[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_LEADERBOARD(testId);
            await this.cacheService.set(key, leaderboard, { ttl });
            logger.debug('Test leaderboard cached successfully', 'TestCachedService', { testId, count: leaderboard.length });
        } catch (error) {
            logger.error('Failed to cache test leaderboard', 'TestCachedService', { testId, error });
        }
    }

    /**
     * Get tests by user from cache
     */
    async getTestsByUser(userId: string): Promise<TestResponseDto[] | null> {
        try {
            const key = TEST_CACHE_KEYS.TESTS_BY_USER(userId);
            return await this.cacheService.get<TestResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get tests by user from cache', 'TestCachedService', { userId, error });
            return null;
        }
    }

    /**
     * Set tests by user in cache
     */
    async setTestsByUser(userId: string, tests: TestResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TESTS_BY_USER(userId);
            await this.cacheService.set(key, tests, { ttl });
            logger.debug('Tests by user cached successfully', 'TestCachedService', { userId, count: tests.length });
        } catch (error) {
            logger.error('Failed to cache tests by user', 'TestCachedService', { userId, error });
        }
    }

    /**
     * Get test performance from cache
     */
    async getTestPerformance(testId: string): Promise<any | null> {
        try {
            const key = TEST_CACHE_KEYS.TEST_PERFORMANCE(testId);
            return await this.cacheService.get<any>(key);
        } catch (error) {
            logger.error('Failed to get test performance from cache', 'TestCachedService', { testId, error });
            return null;
        }
    }

    /**
     * Set test performance in cache
     */
    async setTestPerformance(testId: string, performance: any, ttl?: number): Promise<void> {
        try {
            const key = TEST_CACHE_KEYS.TEST_PERFORMANCE(testId);
            await this.cacheService.set(key, performance, { ttl });
            logger.debug('Test performance cached successfully', 'TestCachedService', { testId });
        } catch (error) {
            logger.error('Failed to cache test performance', 'TestCachedService', { testId, error });
        }
    }

    /**
     * Invalidate test cache
     */
    async invalidateTestCache(testId: string): Promise<void> {
        try {
            const keys = [
                TEST_CACHE_KEYS.TEST_BY_ID(testId),
                TEST_CACHE_KEYS.TEST_QUESTIONS(testId),
                TEST_CACHE_KEYS.TEST_STATS(testId),
                TEST_CACHE_KEYS.TEST_RESULTS(testId),
                TEST_CACHE_KEYS.TEST_SUBMISSIONS(testId),
                TEST_CACHE_KEYS.TEST_LEADERBOARD(testId),
                TEST_CACHE_KEYS.TEST_PERFORMANCE(testId),
            ];

            await Promise.all(keys.map(key => this.cacheService.delete(key)));
            logger.debug('Test cache invalidated successfully', 'TestCachedService', { testId });
        } catch (error) {
            logger.error('Failed to invalidate test cache', 'TestCachedService', { testId, error });
        }
    }

    /**
     * Invalidate all test list caches
     */
    async invalidateTestListCaches(): Promise<void> {
        try {
            // This would need to be implemented with pattern matching
            // For now, we'll log that this should be implemented
            logger.warn('Invalidate test list caches not implemented - requires pattern matching', 'TestCachedService');
        } catch (error) {
            logger.error('Failed to invalidate test list caches', 'TestCachedService', { error });
        }
    }
}

// Lazy-loaded singleton to avoid Redis dependency during module loading
let _testCachedService: TestCachedService | null = null;

export const testCachedService = {
    async getTest(testId: string) {
        if (!_testCachedService) _testCachedService = new TestCachedService();
        return _testCachedService.getTest(testId);
    },
    async setTest(testId: string, test: TestResponseDto, ttl?: number) {
        if (!_testCachedService) _testCachedService = new TestCachedService();
        return _testCachedService.setTest(testId, test, ttl);
    },
    async getTestList(filters: string) {
        if (!_testCachedService) _testCachedService = new TestCachedService();
        return _testCachedService.getTestList(filters);
    },
    async setTestList(filters: string, tests: TestResponseDto[], ttl?: number) {
        if (!_testCachedService) _testCachedService = new TestCachedService();
        return _testCachedService.setTestList(filters, tests, ttl);
    },
    async invalidateTestCache(testId: string) {
        if (!_testCachedService) _testCachedService = new TestCachedService();
        return _testCachedService.invalidateTestCache(testId);
    },
    async invalidateTestListCaches() {
        if (!_testCachedService) _testCachedService = new TestCachedService();
        return _testCachedService.invalidateTestListCaches();
    }
};
