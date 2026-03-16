/**
 * Assessment Cache Keys Constants
 * Defines all cache keys used for assessment-related caching
 */

export const ASSESSMENT_CACHE_KEYS = {
    // Assessment by ID
    ASSESSMENT_BY_ID: (assessmentId: string) => `assessment:${assessmentId}`,

    // Assessment List (with filters)
    ASSESSMENT_LIST: (filters: string) => `assessment:list:${filters}`,

    // Assessment Questions
    ASSESSMENT_QUESTIONS: (assessmentId: string) => `assessment:questions:${assessmentId}`,

    // Assessment Stats
    ASSESSMENT_STATS: (assessmentId: string) => `assessment:stats:${assessmentId}`,

    // Assessment Results
    ASSESSMENT_RESULTS: (assessmentId: string) => `assessment:results:${assessmentId}`,

    // Assessment by College
    ASSESSMENT_BY_COLLEGE: (collegeId: string) => `assessment:college:${collegeId}`,

    // Assessment by Course
    ASSESSMENT_BY_COURSE: (courseId: string) => `assessment:course:${courseId}`,

    // Assessment by Status
    ASSESSMENT_BY_STATUS: (status: string) => `assessment:status:${status}`,

    // Assessment by Type
    ASSESSMENT_BY_TYPE: (type: string) => `assessment:type:${type}`,

    // Assessment Invitations
    ASSESSMENT_INVITATIONS: (assessmentId: string) => `assessment:invitations:${assessmentId}`,

    // Assessment Participants
    ASSESSMENT_PARTICIPANTS: (assessmentId: string) => `assessment:participants:${assessmentId}`,

    // Assessment Leaderboard
    ASSESSMENT_LEADERBOARD: (assessmentId: string) => `assessment:leaderboard:${assessmentId}`,
} as const;

export type AssessmentCacheKey = typeof ASSESSMENT_CACHE_KEYS[keyof typeof ASSESSMENT_CACHE_KEYS];
