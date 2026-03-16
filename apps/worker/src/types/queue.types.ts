/**
 * Professional Queue System Types and Interfaces
 * 
 * This module defines comprehensive type definitions for the queue system,
 * ensuring type safety, maintainability, and scalability across all job types.
 * 
 * @author Senior Development Team
 * @version 2.0.0
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Mail job types with comprehensive coverage
 */
export enum MailJobType {
    // Authentication related emails
    REGISTER = 'register',
    FORGOT_PASSWORD = 'forgot-password',
    RESET_PASSWORD = 'reset-password',
    WELCOME = 'welcome',

    // Assessment related emails
    ASSESSMENT_INVITATION = 'assessment-invitation',
    ASSESSMENT_REMINDER = 'assessment-reminder',
    ASSESSMENT_RESULT = 'assessment-result',

    // System emails
    SYSTEM_NOTIFICATION = 'system-notification',
    MAINTENANCE_ALERT = 'maintenance-alert',
}

/**
 * Notification job types
 */
export enum NotificationJobType {
    PUSH = 'push',
    SMS = 'sms',
    IN_APP = 'in-app',
    EMAIL = 'email',
}

/**
 * Data processing job types
 */
export enum DataProcessingJobType {
    IMAGE_RESIZE = 'image-resize',
    PDF_GENERATE = 'pdf-generate',
    DATA_EXPORT = 'data-export',
    FILE_COMPRESS = 'file-compress',
    BATCH_PROCESS = 'batch-process',
}

/**
 * Job priority levels
 */
export enum JobPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    URGENT = 3,
    CRITICAL = 4,
}

/**
 * Code submission job types
 */
export enum CodeSubmissionJobType {
    TEST_SUBMISSION = 'test-submission',
    CODE_EXECUTION = 'code-execution',
}

/**
 * Queue names for different job types
 */
export const QUEUE_NAMES = {
    MAIL: 'mail-queue',
    NOTIFICATIONS: 'notifications-queue',
    DATA_PROCESSING: 'data-processing-queue',
    ASSESSMENT_INVITATIONS: 'assessment-invitations-queue',
    CODE_SUBMISSIONS: 'code-submissions-queue',
} as const;

/**
 * Mail template names
 */
export const MAIL_TEMPLATES = {
    // Authentication templates
    REGISTER: 'register',
    FORGOT_PASSWORD: 'forgot-password',
    RESET_PASSWORD: 'reset-password',
    WELCOME: 'welcome',

    // Assessment templates
    ASSESSMENT_INVITATION_REGISTERED: 'assessment-invitation-registered',
    ASSESSMENT_INVITATION_UNREGISTERED: 'assessment-invitation-unregistered',
    ASSESSMENT_REMINDER: 'assessment-reminder',
    ASSESSMENT_RESULT: 'assessment-result',
    ASSESSMENT_CERTIFICATE: 'assessment-certificate',
    INDIVIDUAL_ASSESSMENT_REPORT: 'individual-assessment-report',

    // System templates
    SYSTEM_NOTIFICATION: 'system-notification',
    MAINTENANCE_ALERT: 'maintenance-alert',
    MAINTENANCE_COMPLETED: 'maintenance-completed',
    MAINTENANCE_CANCELLED: 'maintenance-cancelled',
} as const;

// ============================================================================
// BASE INTERFACES
// ============================================================================

/**
 * Base interface for all job data
 */
export interface BaseJobData {
    type: string;
    metadata?: JobMetadata;
    createdAt: Date;
    scheduledAt?: Date;
    expiresAt?: Date;
}

/**
 * Job metadata for tracking and monitoring
 */
export interface JobMetadata {
    userId?: string;
    assessmentId?: string;
    collegeId?: string;
    courseId?: string;
    priority?: JobPriority;
    retryCount?: number;
    maxRetries?: number;
    source?: string;
    tags?: string[];
    correlationId?: string;
    parentJobId?: string;
}

/**
 * Base mail job data interface
 */
export interface BaseMailJobData extends BaseJobData {
    type: MailJobType;
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
}

// ============================================================================
// SPECIFIC JOB DATA INTERFACES
// ============================================================================

/**
 * Authentication-related mail job data
 */
export interface AuthMailJobData extends BaseMailJobData {
    type: MailJobType.REGISTER | MailJobType.FORGOT_PASSWORD | MailJobType.RESET_PASSWORD | MailJobType.WELCOME;
    data: {
        // User information
        name?: string;
        email?: string;

        // Authentication data
        token?: string;
        link?: string;
        verificationLink?: string;
        resetLink?: string;
        newPassword?: string;

        // App configuration
        appName?: string;
        appUrl?: string;
        supportEmail?: string;
        helpUrl?: string;

        // Expiration and security
        expirationMinutes?: number;
        features?: string[];

        // Additional context
        ipAddress?: string;
        userAgent?: string;
        location?: string;
    };
}

/**
 * Assessment invitation mail job data
 */
export interface AssessmentInvitationMailJobData extends BaseMailJobData {
    type: MailJobType.ASSESSMENT_INVITATION;
    data: {
        // User information
        userName?: string;
        userEmail?: string;
        isRegistered?: boolean;
        registrationNo?: string;

        // Assessment information
        assessmentId: string;
        assessmentTitle: string;
        assessmentDescription?: string;
        assessmentType: string;
        duration: number;
        totalMarks?: number;
        totalQuestions?: number;

        // Timing information
        startDate?: Date;
        endDate?: Date;
        instruction?: string;

        // Navigation URLs
        assessmentUrl: string;
        loginUrl?: string;
        registerUrl?: string;
        dashboardUrl?: string;

        // Context information
        collegeName?: string;
        courseName?: string;
        year?: number;
        branchName?: string;

        // App configuration
        appName: string;
        appUrl: string;
        appDomain?: string;
        supportEmail?: string;
        helpUrl?: string;

        // Invitation specific
        invitationCode?: string;
        invitationExpiry?: Date;
        isBulkInvitation?: boolean;

        // Additional data
        customMessage?: string;
        attachments?: Array<{
            name: string;
            url: string;
            type: string;
        }>;
    };
}

/**
 * Assessment result mail job data
 */
export interface AssessmentResultMailJobData extends BaseMailJobData {
    type: MailJobType.ASSESSMENT_RESULT;
    data: {
        // User information
        userName: string;
        userEmail: string;
        registrationNo?: string;

        // Assessment information
        assessmentId: string;
        assessmentTitle: string;
        assessmentType: string;
        totalMarks: number;
        obtainedMarks: number;
        percentage: number;
        grade?: string;
        rank?: number;
        totalParticipants?: number;

        // Performance details
        correctAnswers: number;
        incorrectAnswers: number;
        unattemptedQuestions: number;
        timeTaken: number; // in minutes
        timeLimit: number; // in minutes

        // Timing information
        submittedAt: Date;
        startDate?: Date;
        endDate?: Date;

        // Navigation URLs
        resultUrl: string;
        certificateUrl?: string;
        dashboardUrl?: string;
        leaderboardUrl?: string;

        // Context information
        collegeName?: string;
        courseName?: string;
        year?: number;
        branchName?: string;

        // App configuration
        appName: string;
        appUrl: string;
        supportEmail?: string;
        helpUrl?: string;

        // Result specific
        isPassed: boolean;
        passingPercentage?: number;
        feedback?: string;
        recommendations?: string[];
        nextAssessmentUrl?: string;

        // Additional data
        achievements?: Array<{
            name: string;
            description: string;
            icon?: string;
        }>;
        attachments?: Array<{
            name: string;
            url: string;
            type: string;
        }>;
    };
}

/**
 * Assessment reminder mail job data
 */
export interface AssessmentReminderMailJobData extends BaseMailJobData {
    type: MailJobType.ASSESSMENT_REMINDER;
    data: {
        // User information
        userName: string;
        userEmail: string;
        registrationNo?: string;

        // Assessment information
        assessmentId: string;
        assessmentTitle: string;
        assessmentDescription?: string;
        assessmentType: string;
        duration: number;
        totalMarks?: number;
        totalQuestions?: number;

        // Timing information
        startDate?: Date;
        endDate: Date;
        timeRemaining: number; // in hours
        instruction?: string;

        // Navigation URLs
        assessmentUrl: string;
        dashboardUrl?: string;
        loginUrl?: string;

        // Context information
        collegeName?: string;
        courseName?: string;
        year?: number;
        branchName?: string;

        // App configuration
        appName: string;
        appUrl: string;
        supportEmail?: string;
        helpUrl?: string;

        // Reminder specific
        reminderType: 'first' | 'second' | 'final' | 'urgent';
        daysRemaining?: number;
        hoursRemaining?: number;
        isLastReminder?: boolean;

        // Additional data
        customMessage?: string;
        tips?: string[];
    };
}

/**
 * System notification mail job data
 */
export interface SystemNotificationMailJobData extends BaseMailJobData {
    type: MailJobType.SYSTEM_NOTIFICATION;
    data: {
        // User information
        userName?: string;
        userEmail: string;
        userId?: string;

        // Notification information
        notificationId: string;
        title: string;
        message: string;
        category: 'info' | 'warning' | 'success' | 'error' | 'update';
        priority: 'low' | 'normal' | 'high' | 'urgent';

        // Action information
        actionRequired?: boolean;
        actionText?: string;
        actionUrl?: string;
        actionExpiry?: Date;

        // Navigation URLs
        dashboardUrl?: string;
        settingsUrl?: string;
        helpUrl?: string;

        // App configuration
        appName: string;
        appUrl: string;
        supportEmail?: string;

        // System specific
        systemVersion?: string;
        affectedFeatures?: string[];
        resolutionSteps?: string[];
        relatedTicketId?: string;

        // Additional data
        metadata?: Record<string, any>;
        attachments?: Array<{
            name: string;
            url: string;
            type: string;
        }>;
        customHtml?: string;
        report?: any;
    };
}

/**
 * Maintenance alert mail job data
 */
export interface MaintenanceAlertMailJobData extends BaseMailJobData {
    type: MailJobType.MAINTENANCE_ALERT;
    data: {
        // User information
        userName?: string;
        userEmail: string;
        userId?: string;

        // Maintenance information
        maintenanceId: string;
        title: string;
        description: string;
        type: 'scheduled' | 'emergency' | 'completed' | 'cancelled';
        priority: 'low' | 'normal' | 'high' | 'critical';

        // Timing information
        startTime: Date;
        endTime: Date;
        duration: number; // in minutes
        timezone: string;

        // Affected services
        affectedServices: string[];
        affectedFeatures: string[];
        impactLevel: 'minimal' | 'moderate' | 'significant' | 'complete';

        // Navigation URLs
        statusPageUrl?: string;
        dashboardUrl?: string;
        helpUrl?: string;

        // App configuration
        appName: string;
        appUrl: string;
        supportEmail?: string;

        // Maintenance specific
        reason: string;
        expectedResolution?: string;
        alternativeAccess?: string;
        contactInfo?: {
            phone?: string;
            email?: string;
            chat?: string;
        };

        // Additional data
        updates?: Array<{
            timestamp: Date;
            message: string;
            status: 'in_progress' | 'completed' | 'delayed' | 'cancelled';
        }>;
        preparationSteps?: string[];
        postMaintenanceSteps?: string[];
    };
}

/**
 * Notification job data
 */
export interface NotificationJobData extends BaseJobData {
    type: NotificationJobType;
    userId: string;
    title: string;
    message: string;
    data?: {
        actionUrl?: string;
        imageUrl?: string;
        sound?: string;
        badge?: number;
        category?: string;
        threadId?: string;
        [key: string]: any;
    };
}

/**
 * Data processing job data
 */
export interface DataProcessingJobData extends BaseJobData {
    type: DataProcessingJobType;
    fileId: string;
    options: {
        quality?: number;
        format?: string;
        size?: { width: number; height: number };
        compression?: number;
        watermark?: string;
        [key: string]: any;
    };
}

/**
 * Code submission job data
 */
export interface CodeSubmissionJobData extends BaseJobData {
    type: CodeSubmissionJobType;
    submissionId: string;
    testId: string;
    userId: string;
    sourceCode: string;
    languageId: number;
    // NEW: Include all test data to avoid database fetch in worker
    testData: {
        title: string;
        executeCodeName: string;
        constraints: string;
        testCases: Array<{
            _id: string;
            inputs: Array<{
                value: string;
                order: number;
                inputFormat: string;
            }>;
            expectedOutput: string;
            isHidden: boolean;
            outputFormat: string;
        }>;
    };
}

// Result structure returned by worker
export interface CodeSubmissionResult {
    submissionId: string;
    testId: string;
    userId: string;
    sourceCode: string;
    languageId: number;
    status: 'completed' | 'failed';
    testResults: Array<{
        testCaseId: string;
        passed: boolean;
        actualOutput?: string;
        expectedOutput: string;
        executionTime?: number;
        memoryUsed?: number;
        errorMessage?: string;
    }>;
    totalTestCases: number;
    passedTestCases: number;
    score: number;
    executionTime: number;
}


// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * Union type for all mail job data
 */
export type MailJobData =
    | AuthMailJobData
    | AssessmentInvitationMailJobData
    | AssessmentResultMailJobData
    | AssessmentReminderMailJobData
    | SystemNotificationMailJobData
    | MaintenanceAlertMailJobData;

/**
 * Union type for all job data
 */
export type JobData = MailJobData | NotificationJobData | DataProcessingJobData | CodeSubmissionJobData;

// ============================================================================
// QUEUE CONFIGURATION
// ============================================================================

/**
 * Queue configuration interface
 */
export interface QueueConfig {
    name: string;
    concurrency?: number;
    delay?: number;
    attempts?: number;
    backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
    };
    removeOnComplete?: number;
    removeOnFail?: number;
    defaultJobOptions?: {
        removeOnComplete?: number;
        removeOnFail?: number;
        delay?: number;
        attempts?: number;
    };
}

/**
 * Queue statistics interface
 */
export interface QueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
    processingRate?: number;
    errorRate?: number;
}

/**
 * Job processing result interface
 */
export interface JobProcessingResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: Error;
    retryable?: boolean;
    nextRetryAt?: Date;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for mail job data
 */
export function isMailJobData(jobData: JobData): jobData is MailJobData {
    return Object.values(MailJobType).includes(jobData.type as MailJobType);
}

/**
 * Type guard for assessment invitation mail job data
 */
export function isAssessmentInvitationMailJobData(jobData: JobData): jobData is AssessmentInvitationMailJobData {
    return jobData.type === MailJobType.ASSESSMENT_INVITATION;
}

/**
 * Type guard for assessment result mail job data
 */
export function isAssessmentResultMailJobData(jobData: JobData): jobData is AssessmentResultMailJobData {
    return jobData.type === MailJobType.ASSESSMENT_RESULT;
}

/**
 * Type guard for assessment reminder mail job data
 */
export function isAssessmentReminderMailJobData(jobData: JobData): jobData is AssessmentReminderMailJobData {
    return jobData.type === MailJobType.ASSESSMENT_REMINDER;
}

/**
 * Type guard for system notification mail job data
 */
export function isSystemNotificationMailJobData(jobData: JobData): jobData is SystemNotificationMailJobData {
    return jobData.type === MailJobType.SYSTEM_NOTIFICATION;
}

/**
 * Type guard for maintenance alert mail job data
 */
export function isMaintenanceAlertMailJobData(jobData: JobData): jobData is MaintenanceAlertMailJobData {
    return jobData.type === MailJobType.MAINTENANCE_ALERT;
}

/**
 * Type guard for auth mail job data
 */
export function isAuthMailJobData(jobData: JobData): jobData is AuthMailJobData {
    return [
        MailJobType.REGISTER,
        MailJobType.FORGOT_PASSWORD,
        MailJobType.RESET_PASSWORD,
        MailJobType.WELCOME
    ].includes(jobData.type as MailJobType);
}

/**
 * Type guard for assessment-related mail job data
 */
export function isAssessmentMailJobData(jobData: JobData): jobData is AssessmentInvitationMailJobData | AssessmentResultMailJobData | AssessmentReminderMailJobData {
    return [
        MailJobType.ASSESSMENT_INVITATION,
        MailJobType.ASSESSMENT_RESULT,
        MailJobType.ASSESSMENT_REMINDER
    ].includes(jobData.type as MailJobType);
}

/**
 * Type guard for system-related mail job data
 */
export function isSystemMailJobData(jobData: JobData): jobData is SystemNotificationMailJobData | MaintenanceAlertMailJobData {
    return [
        MailJobType.SYSTEM_NOTIFICATION,
        MailJobType.MAINTENANCE_ALERT
    ].includes(jobData.type as MailJobType);
}

// ============================================================================
// EXPORTED TYPES
// ============================================================================

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
export type MailTemplate = typeof MAIL_TEMPLATES[keyof typeof MAIL_TEMPLATES];
export type JobType = MailJobType | NotificationJobType | DataProcessingJobType;