/**
 * Test Cache Keys Constants
 * Defines all cache keys used for test-related caching
 */

export const TEST_CACHE_KEYS = {
    // Test by ID
    TEST_BY_ID: (testId: string) => `test:${testId}`,

    // Test List (with filters)
    TEST_LIST: (filters: string) => `test:list:${filters}`,

    // Test Questions
    TEST_QUESTIONS: (testId: string) => `test:questions:${testId}`,

    // Test Stats
    TEST_STATS: (testId: string) => `test:stats:${testId}`,

    // Test Results
    TEST_RESULTS: (testId: string) => `test:results:${testId}`,

    // Test by College
    TEST_BY_COLLEGE: (collegeId: string) => `test:college:${collegeId}`,

    // Test by Course
    TEST_BY_COURSE: (courseId: string) => `test:course:${courseId}`,

    // Test by Status
    TEST_BY_STATUS: (status: string) => `test:status:${status}`,

    // Test by Difficulty
    TEST_BY_DIFFICULTY: (difficulty: string) => `test:difficulty:${difficulty}`,

    // Test Submissions
    TEST_SUBMISSIONS: (testId: string) => `test:submissions:${testId}`,

    // Test Leaderboard
    TEST_LEADERBOARD: (testId: string) => `test:leaderboard:${testId}`,

    // Test by User
    TESTS_BY_USER: (userId: string) => `test:user:${userId}`,

    // Test Performance
    TEST_PERFORMANCE: (testId: string) => `test:performance:${testId}`,
} as const;

export type TestCacheKey = typeof TEST_CACHE_KEYS[keyof typeof TEST_CACHE_KEYS];
