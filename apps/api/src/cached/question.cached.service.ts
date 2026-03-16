import { CacheService } from '../core/infrastructure/Cache';
import { QUESTION_CACHE_KEYS } from '../shared/constants/question-cache-keys';
import { QuestionResponseDto } from '../apps/questions/dto/question.dto';
import { Logger } from '@repo/logger';

const logger = new Logger();

export class QuestionCachedService {
    private cacheService: CacheService;

    constructor() {
        this.cacheService = new CacheService();
    }

    /**
     * Get question by ID from cache
     */
    async getQuestion(questionId: string): Promise<QuestionResponseDto | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_BY_ID(questionId);
            return await this.cacheService.get<QuestionResponseDto>(key);
        } catch (error) {
            logger.error('Failed to get question from cache', 'QuestionCachedService', { questionId, error });
            return null;
        }
    }

    /**
     * Set question in cache
     */
    async setQuestion(questionId: string, question: QuestionResponseDto, ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_BY_ID(questionId);
            await this.cacheService.set(key, question, { ttl });
            logger.debug('Question cached successfully', 'QuestionCachedService', { questionId });
        } catch (error) {
            logger.error('Failed to cache question', 'QuestionCachedService', { questionId, error });
        }
    }

    /**
     * Get question list from cache
     */
    async getQuestionList(filters: string): Promise<QuestionResponseDto[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_LIST(filters);
            return await this.cacheService.get<QuestionResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get question list from cache', 'QuestionCachedService', { filters, error });
            return null;
        }
    }

    /**
     * Set question list in cache
     */
    async setQuestionList(filters: string, questions: QuestionResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_LIST(filters);
            await this.cacheService.set(key, questions, { ttl });
            logger.debug('Question list cached successfully', 'QuestionCachedService', { filters, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache question list', 'QuestionCachedService', { filters, error });
        }
    }

    /**
     * Get questions by IDs from cache
     */
    async getQuestionsByIds(ids: string): Promise<QuestionResponseDto[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_IDS(ids);
            return await this.cacheService.get<QuestionResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get questions by IDs from cache', 'QuestionCachedService', { ids, error });
            return null;
        }
    }

    /**
     * Set questions by IDs in cache
     */
    async setQuestionsByIds(ids: string, questions: QuestionResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_IDS(ids);
            await this.cacheService.set(key, questions, { ttl });
            logger.debug('Questions by IDs cached successfully', 'QuestionCachedService', { ids, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache questions by IDs', 'QuestionCachedService', { ids, error });
        }
    }

    /**
     * Get questions by category from cache
     */
    async getQuestionsByCategory(category: string): Promise<QuestionResponseDto[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_CATEGORY(category);
            return await this.cacheService.get<QuestionResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get questions by category from cache', 'QuestionCachedService', { category, error });
            return null;
        }
    }

    /**
     * Set questions by category in cache
     */
    async setQuestionsByCategory(category: string, questions: QuestionResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_CATEGORY(category);
            await this.cacheService.set(key, questions, { ttl });
            logger.debug('Questions by category cached successfully', 'QuestionCachedService', { category, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache questions by category', 'QuestionCachedService', { category, error });
        }
    }

    /**
     * Get questions by difficulty from cache
     */
    async getQuestionsByDifficulty(difficulty: string): Promise<QuestionResponseDto[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_DIFFICULTY(difficulty);
            return await this.cacheService.get<QuestionResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get questions by difficulty from cache', 'QuestionCachedService', { difficulty, error });
            return null;
        }
    }

    /**
     * Set questions by difficulty in cache
     */
    async setQuestionsByDifficulty(difficulty: string, questions: QuestionResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_DIFFICULTY(difficulty);
            await this.cacheService.set(key, questions, { ttl });
            logger.debug('Questions by difficulty cached successfully', 'QuestionCachedService', { difficulty, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache questions by difficulty', 'QuestionCachedService', { difficulty, error });
        }
    }

    /**
     * Get questions by type from cache
     */
    async getQuestionsByType(type: string): Promise<QuestionResponseDto[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_TYPE(type);
            return await this.cacheService.get<QuestionResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get questions by type from cache', 'QuestionCachedService', { type, error });
            return null;
        }
    }

    /**
     * Set questions by type in cache
     */
    async setQuestionsByType(type: string, questions: QuestionResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_TYPE(type);
            await this.cacheService.set(key, questions, { ttl });
            logger.debug('Questions by type cached successfully', 'QuestionCachedService', { type, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache questions by type', 'QuestionCachedService', { type, error });
        }
    }

    /**
     * Get questions by subject from cache
     */
    async getQuestionsBySubject(subject: string): Promise<QuestionResponseDto[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_SUBJECT(subject);
            return await this.cacheService.get<QuestionResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get questions by subject from cache', 'QuestionCachedService', { subject, error });
            return null;
        }
    }

    /**
     * Set questions by subject in cache
     */
    async setQuestionsBySubject(subject: string, questions: QuestionResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_SUBJECT(subject);
            await this.cacheService.set(key, questions, { ttl });
            logger.debug('Questions by subject cached successfully', 'QuestionCachedService', { subject, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache questions by subject', 'QuestionCachedService', { subject, error });
        }
    }

    /**
     * Get question stats from cache
     */
    async getQuestionStats(questionId: string): Promise<any | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_STATS(questionId);
            return await this.cacheService.get<any>(key);
        } catch (error) {
            logger.error('Failed to get question stats from cache', 'QuestionCachedService', { questionId, error });
            return null;
        }
    }

    /**
     * Set question stats in cache
     */
    async setQuestionStats(questionId: string, stats: any, ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_STATS(questionId);
            await this.cacheService.set(key, stats, { ttl });
            logger.debug('Question stats cached successfully', 'QuestionCachedService', { questionId });
        } catch (error) {
            logger.error('Failed to cache question stats', 'QuestionCachedService', { questionId, error });
        }
    }

    /**
     * Get question options from cache
     */
    async getQuestionOptions(questionId: string): Promise<any[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_OPTIONS(questionId);
            return await this.cacheService.get<any[]>(key);
        } catch (error) {
            logger.error('Failed to get question options from cache', 'QuestionCachedService', { questionId, error });
            return null;
        }
    }

    /**
     * Set question options in cache
     */
    async setQuestionOptions(questionId: string, options: any[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_OPTIONS(questionId);
            await this.cacheService.set(key, options, { ttl });
            logger.debug('Question options cached successfully', 'QuestionCachedService', { questionId, count: options.length });
        } catch (error) {
            logger.error('Failed to cache question options', 'QuestionCachedService', { questionId, error });
        }
    }

    /**
     * Get question solutions from cache
     */
    async getQuestionSolutions(questionId: string): Promise<any | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_SOLUTIONS(questionId);
            return await this.cacheService.get<any>(key);
        } catch (error) {
            logger.error('Failed to get question solutions from cache', 'QuestionCachedService', { questionId, error });
            return null;
        }
    }

    /**
     * Set question solutions in cache
     */
    async setQuestionSolutions(questionId: string, solutions: any, ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_SOLUTIONS(questionId);
            await this.cacheService.set(key, solutions, { ttl });
            logger.debug('Question solutions cached successfully', 'QuestionCachedService', { questionId });
        } catch (error) {
            logger.error('Failed to cache question solutions', 'QuestionCachedService', { questionId, error });
        }
    }

    /**
     * Get question tags from cache
     */
    async getQuestionTags(questionId: string): Promise<string[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_TAGS(questionId);
            return await this.cacheService.get<string[]>(key);
        } catch (error) {
            logger.error('Failed to get question tags from cache', 'QuestionCachedService', { questionId, error });
            return null;
        }
    }

    /**
     * Set question tags in cache
     */
    async setQuestionTags(questionId: string, tags: string[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTION_TAGS(questionId);
            await this.cacheService.set(key, tags, { ttl });
            logger.debug('Question tags cached successfully', 'QuestionCachedService', { questionId, count: tags.length });
        } catch (error) {
            logger.error('Failed to cache question tags', 'QuestionCachedService', { questionId, error });
        }
    }

    /**
     * Get questions by author from cache
     */
    async getQuestionsByAuthor(authorId: string): Promise<QuestionResponseDto[] | null> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_AUTHOR(authorId);
            return await this.cacheService.get<QuestionResponseDto[]>(key);
        } catch (error) {
            logger.error('Failed to get questions by author from cache', 'QuestionCachedService', { authorId, error });
            return null;
        }
    }

    /**
     * Set questions by author in cache
     */
    async setQuestionsByAuthor(authorId: string, questions: QuestionResponseDto[], ttl?: number): Promise<void> {
        try {
            const key = QUESTION_CACHE_KEYS.QUESTIONS_BY_AUTHOR(authorId);
            await this.cacheService.set(key, questions, { ttl });
            logger.debug('Questions by author cached successfully', 'QuestionCachedService', { authorId, count: questions.length });
        } catch (error) {
            logger.error('Failed to cache questions by author', 'QuestionCachedService', { authorId, error });
        }
    }

    /**
     * Invalidate question cache
     */
    async invalidateQuestionCache(questionId: string): Promise<void> {
        try {
            const keys = [
                QUESTION_CACHE_KEYS.QUESTION_BY_ID(questionId),
                QUESTION_CACHE_KEYS.QUESTION_STATS(questionId),
                QUESTION_CACHE_KEYS.QUESTION_OPTIONS(questionId),
                QUESTION_CACHE_KEYS.QUESTION_SOLUTIONS(questionId),
                QUESTION_CACHE_KEYS.QUESTION_TAGS(questionId),
            ];

            await Promise.all(keys.map(key => this.cacheService.delete(key)));
            logger.debug('Question cache invalidated successfully', 'QuestionCachedService', { questionId });
        } catch (error) {
            logger.error('Failed to invalidate question cache', 'QuestionCachedService', { questionId, error });
        }
    }

    /**
     * Invalidate all question list caches
     */
    async invalidateQuestionListCaches(): Promise<void> {
        try {
            // This would need to be implemented with pattern matching
            // For now, we'll log that this should be implemented
            logger.warn('Invalidate question list caches not implemented - requires pattern matching', 'QuestionCachedService');
        } catch (error) {
            logger.error('Failed to invalidate question list caches', 'QuestionCachedService', { error });
        }
    }
}

// Lazy-loaded singleton to avoid Redis dependency during module loading
let _questionCachedService: QuestionCachedService | null = null;

export const questionCachedService = {
    async getQuestion(questionId: string) {
        if (!_questionCachedService) _questionCachedService = new QuestionCachedService();
        return _questionCachedService.getQuestion(questionId);
    },
    async setQuestion(questionId: string, question: QuestionResponseDto, ttl?: number) {
        if (!_questionCachedService) _questionCachedService = new QuestionCachedService();
        return _questionCachedService.setQuestion(questionId, question, ttl);
    },
    async getQuestionList(filters: string) {
        if (!_questionCachedService) _questionCachedService = new QuestionCachedService();
        return _questionCachedService.getQuestionList(filters);
    },
    async setQuestionList(filters: string, questions: QuestionResponseDto[], ttl?: number) {
        if (!_questionCachedService) _questionCachedService = new QuestionCachedService();
        return _questionCachedService.setQuestionList(filters, questions, ttl);
    },
    async invalidateQuestionCache(questionId: string) {
        if (!_questionCachedService) _questionCachedService = new QuestionCachedService();
        return _questionCachedService.invalidateQuestionCache(questionId);
    },
    async invalidateQuestionListCaches() {
        if (!_questionCachedService) _questionCachedService = new QuestionCachedService();
        return _questionCachedService.invalidateQuestionListCaches();
    }
};
