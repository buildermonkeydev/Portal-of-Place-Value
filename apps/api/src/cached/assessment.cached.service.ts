import { RedisService } from '../core/infrastructure/Redis';
import { ASSESSMENT_CACHE_KEYS } from '../shared/constants/assessment-cache-keys';
import { AssessmentResponseDto } from '../apps/assessment/dto/assessment.dto';
import { Logger } from '@repo/logger';

const logger = new Logger();

export class AssessmentCachedService {
    private redisService: RedisService;

    constructor() {
        this.redisService = RedisService.getInstance();
    }

    /**
     * Get assessment by ID from cache
     */
    async getAssessment(assessmentId: string): Promise<AssessmentResponseDto | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_ID(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<AssessmentResponseDto>(key);
        } catch (error) {
            logger.error('Failed to get assessment from cache', 'AssessmentCachedService', { assessmentId, error });
            return null;
        }
    }

    /**
     * Set assessment in cache
     */
    async setAssessment(assessmentId: string, assessment: AssessmentResponseDto, ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_ID(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, assessment, { ttl });
            logger.debug('Assessment cached successfully', 'AssessmentCachedService', { assessmentId });
        } catch (error) {
            logger.error('Failed to cache assessment', 'AssessmentCachedService', { assessmentId, error });
        }
    }

    /**
     * Get assessment list from cache
     */
    async getAssessmentList(filters: string): Promise<AssessmentResponseDto[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_LIST(filters);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<AssessmentResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get assessment list from cache', 'AssessmentCachedService', { filters, error });
            return null;
        }
    }

    /**
     * Set assessment list in cache
     */
    async setAssessmentList(filters: string, assessments: AssessmentResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_LIST(filters);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, assessments, { ttl });
            logger.debug('Assessment list cached successfully', 'AssessmentCachedService', { filters, count: assessments.length });
        } catch (error) {
            logger.error('Failed to cache assessment list', 'AssessmentCachedService', { filters, error });
        }
    }

    /**
     * Get assessment list with pagination from cache
     */
    async getAssessmentListWithPagination(filters: string): Promise<{
        assessments: AssessmentResponseDto[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    } | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_LIST(filters);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<{
                assessments: AssessmentResponseDto[];
                pagination: {
                    currentPage: number;
                    totalPages: number;
                    totalItems: number;
                    itemsPerPage: number;
                    hasNextPage: boolean;
                    hasPrevPage: boolean;
                };
            }>(key);
        } catch (error) {
            logger.error('Failed to get assessment list with pagination from cache', 'AssessmentCachedService', { filters, error });
            return null;
        }
    }

    /**
     * Set assessment list with pagination in cache
     */
    async setAssessmentListWithPagination(
        filters: string,
        data: {
            assessments: AssessmentResponseDto[];
            pagination: {
                currentPage: number;
                totalPages: number;
                totalItems: number;
                itemsPerPage: number;
                hasNextPage: boolean;
                hasPrevPage: boolean;
            };
        },
        ttl?: number
    ): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_LIST(filters);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, data, { ttl });
            logger.debug('Assessment list with pagination cached successfully', 'AssessmentCachedService', { filters, count: data.assessments.length });
        } catch (error) {
            logger.error('Failed to cache assessment list with pagination', 'AssessmentCachedService', { filters, error });
        }
    }

    /**
     * Get assessment questions from cache
     */
    async getAssessmentQuestions(assessmentId: string): Promise<any[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_QUESTIONS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get assessment questions from cache', 'AssessmentCachedService', { assessmentId, error });
            return null;
        }
    }

    /**
     * Set assessment questions in cache
     */
    async setAssessmentQuestions(assessmentId: string, questions: any[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_QUESTIONS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, questions, { ttl });
            logger.debug('Assessment questions cached successfully', 'AssessmentCachedService', { assessmentId, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache assessment questions', 'AssessmentCachedService', { assessmentId, error });
        }
    }

    /**
     * Get assessment stats from cache
     */
    async getAssessmentStats(assessmentId: string): Promise<any | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_STATS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<any>(key);
        } catch (error) {
            logger.error('Failed to get assessment stats from cache', 'AssessmentCachedService', { assessmentId, error });
            return null;
        }
    }

    /**
     * Set assessment stats in cache
     */
    async setAssessmentStats(assessmentId: string, stats: any, ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_STATS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, stats, { ttl });
            logger.debug('Assessment stats cached successfully', 'AssessmentCachedService', { assessmentId });
        } catch (error) {
            logger.error('Failed to cache assessment stats', 'AssessmentCachedService', { assessmentId, error });
        }
    }

    /**
     * Get assessment results from cache
     */
    async getAssessmentResults(assessmentId: string): Promise<any[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_RESULTS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get assessment results from cache', 'AssessmentCachedService', { assessmentId, error });
            return null;
        }
    }

    /**
     * Set assessment results in cache
     */
    async setAssessmentResults(assessmentId: string, results: any[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_RESULTS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, results, { ttl });
            logger.debug('Assessment results cached successfully', 'AssessmentCachedService', { assessmentId, count: results.length });
        } catch (error) {
            logger.error('Failed to cache assessment results', 'AssessmentCachedService', { assessmentId, error });
        }
    }

    /**
     * Get assessments by college from cache
     */
    async getAssessmentsByCollege(collegeId: string): Promise<AssessmentResponseDto[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_COLLEGE(collegeId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<AssessmentResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get assessments by college from cache', 'AssessmentCachedService', { collegeId, error });
            return null;
        }
    }

    /**
     * Set assessments by college in cache
     */
    async setAssessmentsByCollege(collegeId: string, assessments: AssessmentResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_COLLEGE(collegeId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, assessments, { ttl });
            logger.debug('Assessments by college cached successfully', 'AssessmentCachedService', { collegeId, count: assessments.length });
        } catch (error) {
            logger.error('Failed to cache assessments by college', 'AssessmentCachedService', { collegeId, error });
        }
    }

    /**
     * Get assessments by course from cache
     */
    async getAssessmentsByCourse(courseId: string): Promise<AssessmentResponseDto[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_COURSE(courseId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<AssessmentResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get assessments by course from cache', 'AssessmentCachedService', { courseId, error });
            return null;
        }
    }

    /**
     * Set assessments by course in cache
     */
    async setAssessmentsByCourse(courseId: string, assessments: AssessmentResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_COURSE(courseId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, assessments, { ttl });
            logger.debug('Assessments by course cached successfully', 'AssessmentCachedService', { courseId, count: assessments.length });
        } catch (error) {
            logger.error('Failed to cache assessments by course', 'AssessmentCachedService', { courseId, error });
        }
    }

    /**
     * Get assessments by status from cache
     */
    async getAssessmentsByStatus(status: string): Promise<AssessmentResponseDto[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_STATUS(status);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<AssessmentResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get assessments by status from cache', 'AssessmentCachedService', { status, error });
            return null;
        }
    }

    /**
     * Set assessments by status in cache
     */
    async setAssessmentsByStatus(status: string, assessments: AssessmentResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_STATUS(status);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, assessments, { ttl });
            logger.debug('Assessments by status cached successfully', 'AssessmentCachedService', { status, count: assessments.length });
        } catch (error) {
            logger.error('Failed to cache assessments by status', 'AssessmentCachedService', { status, error });
        }
    }

    /**
     * Get assessments by type from cache
     */
    async getAssessmentsByType(type: string): Promise<AssessmentResponseDto[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_TYPE(type);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<AssessmentResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get assessments by type from cache', 'AssessmentCachedService', { type, error });
            return null;
        }
    }

    /**
     * Set assessments by type in cache
     */
    async setAssessmentsByType(type: string, assessments: AssessmentResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_TYPE(type);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, assessments, { ttl });
            logger.debug('Assessments by type cached successfully', 'AssessmentCachedService', { type, count: assessments.length });
        } catch (error) {
            logger.error('Failed to cache assessments by type', 'AssessmentCachedService', { type, error });
        }
    }

    /**
     * Get assessment invitations from cache
     */
    async getAssessmentInvitations(assessmentId: string): Promise<any[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_INVITATIONS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get assessment invitations from cache', 'AssessmentCachedService', { assessmentId, error });
            return null;
        }
    }

    /**
     * Set assessment invitations in cache
     */
    async setAssessmentInvitations(assessmentId: string, invitations: any[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_INVITATIONS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, invitations, { ttl });
            logger.debug('Assessment invitations cached successfully', 'AssessmentCachedService', { assessmentId, count: invitations.length });
        } catch (error) {
            logger.error('Failed to cache assessment invitations', 'AssessmentCachedService', { assessmentId, error });
        }
    }

    /**
     * Get assessment participants from cache
     */
    async getAssessmentParticipants(assessmentId: string): Promise<any[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_PARTICIPANTS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get assessment participants from cache', 'AssessmentCachedService', { assessmentId, error });
            return null;
        }
    }

    /**
     * Set assessment participants in cache
     */
    async setAssessmentParticipants(assessmentId: string, participants: any[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_PARTICIPANTS(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, participants, { ttl });
            logger.debug('Assessment participants cached successfully', 'AssessmentCachedService', { assessmentId, count: participants.length });
        } catch (error) {
            logger.error('Failed to cache assessment participants', 'AssessmentCachedService', { assessmentId, error });
        }
    }

    /**
     * Get assessment leaderboard from cache
     */
    async getAssessmentLeaderboard(assessmentId: string): Promise<any[] | null> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_LEADERBOARD(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            return await cacheManager.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get assessment leaderboard from cache', 'AssessmentCachedService', { assessmentId, error });
            return null;
        }
    }

    /**
     * Set assessment leaderboard in cache
     */
    async setAssessmentLeaderboard(assessmentId: string, leaderboard: any[], ttl?: number): Promise<void> {
        try {
            const key = ASSESSMENT_CACHE_KEYS.ASSESSMENT_LEADERBOARD(assessmentId);
            const cacheManager = this.redisService.getCacheManager();
            await cacheManager.set(key, leaderboard, { ttl });
            logger.debug('Assessment leaderboard cached successfully', 'AssessmentCachedService', { assessmentId, count: leaderboard.length });
        } catch (error) {
            logger.error('Failed to cache assessment leaderboard', 'AssessmentCachedService', { assessmentId, error });
        }
    }

    /**
     * Invalidate assessment cache
     */
    async invalidateAssessmentCache(assessmentId: string): Promise<void> {
        try {
            const keys = [
                ASSESSMENT_CACHE_KEYS.ASSESSMENT_BY_ID(assessmentId),
                ASSESSMENT_CACHE_KEYS.ASSESSMENT_QUESTIONS(assessmentId),
                ASSESSMENT_CACHE_KEYS.ASSESSMENT_STATS(assessmentId),
                ASSESSMENT_CACHE_KEYS.ASSESSMENT_RESULTS(assessmentId),
                ASSESSMENT_CACHE_KEYS.ASSESSMENT_INVITATIONS(assessmentId),
                ASSESSMENT_CACHE_KEYS.ASSESSMENT_PARTICIPANTS(assessmentId),
                ASSESSMENT_CACHE_KEYS.ASSESSMENT_LEADERBOARD(assessmentId),
            ];

            const cacheManager = this.redisService.getCacheManager();
            await Promise.all(keys.map(key => cacheManager.delete(key)));

            // Also invalidate pattern-based caches
            await this.invalidateAllAssessmentCaches();

            logger.debug('Assessment cache invalidated successfully', 'AssessmentCachedService', { assessmentId });
        } catch (error) {
            console.log("invalidateAssessmentCacheError", error);
            logger.error('Failed to invalidate assessment cache', 'AssessmentCachedService', { assessmentId, error });
        }
    }

    /**
     * Invalidate all assessment-related caches using pattern matching
     */
    async invalidateAllAssessmentCaches(): Promise<void> {
        try {
            logger.info('Starting invalidateAllAssessmentCaches method', 'AssessmentCachedService');
            const redisClient = this.redisService.getRedisClient();
            const pattern = 'assessment:*';

            logger.info('Starting cache invalidation', 'AssessmentCachedService', { pattern });

            // Test Redis connection
            try {
                const pingResult = await redisClient.ping();
                logger.info('Redis ping successful', 'AssessmentCachedService', { pingResult });
            } catch (pingError) {
                logger.error('Redis ping failed', 'AssessmentCachedService', { pingError });
            }

            const keys = await redisClient.keys(pattern);

            logger.info('Found keys for invalidation', 'AssessmentCachedService', {
                keysCount: keys.length,
                keys: keys.slice(0, 10)
            });

            if (keys.length > 0) {
                const deleteResults = await Promise.all(keys.map(async (key: string) => {
                    try {
                        const result = await redisClient.del(key);
                        logger.debug(`Deleted key: ${key}`, 'AssessmentCachedService', { result });
                        return result;
                    } catch (delError) {
                        logger.error(`Failed to delete key: ${key}`, 'AssessmentCachedService', { delError });
                        return 0;
                    }
                }));

                const totalDeleted = deleteResults.reduce((sum, result) => sum + result, 0);
                logger.info('All assessment caches invalidated successfully', 'AssessmentCachedService', {
                    keysCount: keys.length,
                    totalDeleted,
                    pattern
                });
            } else {
                logger.info('No assessment caches found to invalidate', 'AssessmentCachedService', { pattern });
            }
        } catch (error) {
            logger.error('Failed to invalidate all assessment caches', 'AssessmentCachedService', { error });
        }
    }

    async invalidateAssessmentListCaches(): Promise<void> {
        try {
            const redisClient = this.redisService.getRedisClient();
            const patterns = [
                'assessment:list:*',
                'assessment:college:*',
                'assessment:course:*',
                'assessment:status:*',
                'assessment:type:*',
            ];

            logger.debug('Starting assessment list cache invalidation', 'AssessmentCachedService', { patterns });

            const allKeys: string[] = [];

            // Get all keys matching the patterns
            for (const pattern of patterns) {
                const keys = await redisClient.keys(pattern);
                logger.debug(`Pattern ${pattern} found ${keys.length} keys`, 'AssessmentCachedService', { keys });
                allKeys.push(...keys);
            }

            // Remove duplicates
            const uniqueKeys = [...new Set(allKeys)];

            logger.debug('Found unique keys for list cache invalidation', 'AssessmentCachedService', {
                keysCount: uniqueKeys.length,
                keys: uniqueKeys.slice(0, 10) // Log first 10 keys for debugging
            });

            if (uniqueKeys.length > 0) {
                // Delete all keys in parallel
                const deleteResults = await Promise.all(uniqueKeys.map(async (key: string) => {
                    try {
                        const result = await redisClient.del(key);
                        logger.debug(`Deleted list key: ${key}`, 'AssessmentCachedService', { result });
                        return result;
                    } catch (delError) {
                        logger.error(`Failed to delete list key: ${key}`, 'AssessmentCachedService', { delError });
                        return 0;
                    }
                }));

                const totalDeleted = deleteResults.reduce((sum, result) => sum + result, 0);
                logger.debug('Assessment list caches invalidated successfully', 'AssessmentCachedService', {
                    keysCount: uniqueKeys.length,
                    totalDeleted,
                    patterns
                });
            } else {
                logger.debug('No assessment list caches found to invalidate', 'AssessmentCachedService', { patterns });
            }
        } catch (error) {
            logger.error('Failed to invalidate assessment list caches', 'AssessmentCachedService', { error });
        }
    }

    /**
     * Manual flush all assessment caches - for debugging
     */
    async flushAllAssessmentCaches(): Promise<void> {
        try {
            logger.info('Starting flushAllAssessmentCaches method', 'AssessmentCachedService');
            const redisClient = this.redisService.getRedisClient();

            logger.info('Starting manual flush of all assessment caches', 'AssessmentCachedService');

            // Get all keys with assessment prefix
            const allKeys = await redisClient.keys('assessment:*');

            logger.debug('Found all assessment keys for manual flush', 'AssessmentCachedService', {
                keysCount: allKeys.length,
                keys: allKeys.slice(0, 20)
            });

            if (allKeys.length > 0) {
                // Delete all keys
                const deleteResults = await Promise.all(allKeys.map(async (key: string) => {
                    try {
                        const result = await redisClient.del(key);
                        return result;
                    } catch (delError) {
                        logger.error(`Failed to delete key: ${key}`, 'AssessmentCachedService', { delError });
                        return 0;
                    }
                }));

                const totalDeleted = deleteResults.reduce((sum, result) => sum + result, 0);
                logger.debug('Manual flush completed', 'AssessmentCachedService', {
                    keysCount: allKeys.length,
                    totalDeleted
                });
            } else {
                logger.debug('No assessment keys found for manual flush', 'AssessmentCachedService');
            }
        } catch (error) {
            logger.error('Failed to manually flush assessment caches', 'AssessmentCachedService', { error });
        }
    }
}

let _assessmentCachedService: AssessmentCachedService | null = null;

export const assessmentCachedService = {
    async getAssessment(assessmentId: string) {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.getAssessment(assessmentId);
    },
    async setAssessment(assessmentId: string, assessment: AssessmentResponseDto, ttl?: number) {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.setAssessment(assessmentId, assessment, ttl);
    },
    async getAssessmentList(filters: string) {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.getAssessmentList(filters);
    },
    async setAssessmentList(filters: string, assessments: AssessmentResponseDto[], ttl?: number) {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.setAssessmentList(filters, assessments, ttl);
    },
    async invalidateAssessmentCache(assessmentId: string) {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.invalidateAssessmentCache(assessmentId);
    },
    async invalidateAssessmentListCaches() {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.invalidateAssessmentListCaches();
    },
    async invalidateAllAssessmentCaches() {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.invalidateAllAssessmentCaches();
    },
    async flushAllAssessmentCaches() {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.flushAllAssessmentCaches();
    },
    async getAssessmentListWithPagination(filters: string) {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.getAssessmentListWithPagination(filters);
    },
    async setAssessmentListWithPagination(filters: string, assessments: any, ttl?: number) {
        if (!_assessmentCachedService) _assessmentCachedService = new AssessmentCachedService();
        return _assessmentCachedService.setAssessmentListWithPagination(filters, assessments, ttl);
    }
};
