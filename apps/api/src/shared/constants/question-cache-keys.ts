/**
 * Question Cache Keys Constants
 * Defines all cache keys used for question-related caching
 */

export const QUESTION_CACHE_KEYS = {
  // Question by ID
  QUESTION_BY_ID: (questionId: string) => `question:${questionId}`,
  
  // Question List (with filters)
  QUESTION_LIST: (filters: string) => `question:list:${filters}`,
  
  // Questions by IDs
  QUESTIONS_BY_IDS: (ids: string) => `question:ids:${ids}`,
  
  // Questions by Category
  QUESTIONS_BY_CATEGORY: (category: string) => `question:category:${category}`,
  
  // Questions by Difficulty
  QUESTIONS_BY_DIFFICULTY: (difficulty: string) => `question:difficulty:${difficulty}`,
  
  // Questions by Type
  QUESTIONS_BY_TYPE: (type: string) => `question:type:${type}`,
  
  // Questions by Subject
  QUESTIONS_BY_SUBJECT: (subject: string) => `question:subject:${subject}`,
  
  // Question Stats
  QUESTION_STATS: (questionId: string) => `question:stats:${questionId}`,
  
  // Question Options
  QUESTION_OPTIONS: (questionId: string) => `question:options:${questionId}`,
  
  // Question Solutions
  QUESTION_SOLUTIONS: (questionId: string) => `question:solutions:${questionId}`,
  
  // Question Tags
  QUESTION_TAGS: (questionId: string) => `question:tags:${questionId}`,
  
  // Question by Author
  QUESTIONS_BY_AUTHOR: (authorId: string) => `question:author:${authorId}`,
} as const;

export type QuestionCacheKey = typeof QUESTION_CACHE_KEYS[keyof typeof QUESTION_CACHE_KEYS];
