import { QueueClient } from '../infrastructure/QueueClient';
import { redisService } from '../infrastructure/Redis';
import { MailJobType, MAIL_TEMPLATES } from '@repo/worker';
import { Logger } from '@repo/logger';
import Config from '@repo/env-config';
import { randomUUID } from 'crypto';

const logger = new Logger();
const config = Config.getInstance();

type NotificationCategory = 'info' | 'warning' | 'success' | 'error' | 'update';
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface CustomEmailOptions {
    notificationId?: string;
    category?: NotificationCategory;
    priorityLabel?: NotificationPriority;
    actionUrl?: string;
    actionText?: string;
    message?: string;
    metadata?: Record<string, any>;
}

interface AssessmentCompletionEmailPayload {
    userId: string;
    userName: string;
    userEmail: string;
    registrationNo?: string;
    assessmentId: string;
    assessmentTitle: string;
    assessmentType?: string;
    resultId?: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    correctAnswers?: number;
    incorrectAnswers?: number;
    unattemptedQuestions?: number;
    durationSeconds: number;
    assessmentDurationMinutes?: number;
    submittedAt: Date;
    startDate?: Date;
    endDate?: Date;
    isPassed: boolean;
    passPercentage?: number;
    dashboardUrl?: string;
    certificateUrl?: string;
    resultUrl?: string;
    leaderboardUrl?: string;
    feedback?: string;
    recommendations?: string[];
}

export class EmailService {
    private queueClient: QueueClient | null = null;

    constructor() {
    }

    private getAppConfig() {
        return config.getApp();
    }

    private getUrlsConfig() {
        return config.getUrlsConfig();
    }

    private getSMTPConfig() {
        return config.getSMTP();
    }

    private getAppUrl(): string {
        return process.env.APP_URL || this.getAppConfig().url || 'http://localhost:3000';
    }

    private getDashboardUrl(): string {
        return this.getUrlsConfig().dashboardUrl || `${this.getAppUrl()}/dashboard`;
    }

    private getResultBaseUrl(): string {
        return this.getUrlsConfig().resultUrl || `${this.getAppUrl()}/results`;
    }

    private getSupportEmail(): string {
        return this.getSMTPConfig().user || this.getSMTPConfig().from;
    }

    private getHelpUrl(): string {
        return this.getAppConfig().helpUrl || `${this.getAppUrl()}/help`;
    }

    private getAppName(): string {
        return this.getAppConfig().name || 'Place-Value';
    }

    private getAppDomain(): string {
        return this.getAppConfig().domain || this.getAppUrl();
    }

    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    private mapPriority(priority: number, override?: NotificationPriority): NotificationPriority {
        if (override) {
            return override;
        }

        if (priority >= 80) return 'urgent';
        if (priority >= 50) return 'high';
        if (priority >= 20) return 'normal';
        return 'low';
    }

    private generateNotificationId(prefix: string): string {
        try {
            return `${prefix}-${randomUUID()}`;
        } catch {
            return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        }
    }

    private buildResultUrl(resultId?: string, assessmentId?: string): string {
        const base = this.getResultBaseUrl();
        if (resultId) {
            return `${base}/${resultId}`;
        }
        if (assessmentId) {
            return `${base}/${assessmentId}`;
        }
        return base;
    }

    private getQueueClient(): QueueClient {
        if (!this.queueClient) {
            this.queueClient = redisService.getQueueClient();
        }
        return this.queueClient;
    }

    /**
     * Send registration email
     */
    async sendRegistrationEmail(
        to: string,
        name: string,
        verificationLink: string,
        priority: number = 0
    ): Promise<string> {
        try {
            logger.info('Sending registration email', 'EmailService', { to, name, verificationLink });
            await this.getQueueClient().addMailJob(
                MailJobType.REGISTER,
                to,
                'Welcome! Please verify your email',
                MAIL_TEMPLATES.REGISTER,
                {
                    name,
                    verificationLink,
                },
                { priority }
            );
            logger.info('Registration email queued', 'EmailService', { to });
            return `registration-${Date.now()}`;
        } catch (error) {
            logger.error('Failed to queue registration email', 'EmailService', { to, error });
            throw error;
        }
    }

    /**
     * Send welcome email
     */
    async sendWelcomeEmail(
        to: string,
        name: string,
        priority: number = 0
    ): Promise<string> {
        try {
            logger.info('Sending welcome email', 'EmailService', { to, name });
            await this.getQueueClient().addMailJob(
                MailJobType.WELCOME,
                to,
                'Welcome to Taskverse - A assessment Portal by Placevalue ',
                MAIL_TEMPLATES.WELCOME,
                {
                    name,
                },
                { priority }
            );
            logger.info('Welcome email queued', 'EmailService', { to });
            return `welcome-${Date.now()}`;
        } catch (error) {
            logger.error('Failed to queue welcome email', 'EmailService', { to, error });
            throw error;
        }
    }

    /**
     * Send forgot password email
     */
    async sendForgotPasswordEmail(
        to: string,
        name: string,
        resetLink: string,
        priority: number = 0
    ): Promise<string> {
        try {
            logger.info('Sending forgot password email', 'EmailService', { to, name, resetLink });
            await this.getQueueClient().addMailJob(
                MailJobType.FORGOT_PASSWORD,
                to,
                'Reset your password',
                MAIL_TEMPLATES.FORGOT_PASSWORD,
                {
                    name,
                    resetLink,
                },
                { priority }
            );
            logger.info('Forgot password email queued', 'EmailService', { to });
            return `forgot-password-${Date.now()}`;
        } catch (error) {
            logger.error('Failed to queue forgot password email', 'EmailService', { to, error });
            throw error;
        }
    }

    /**
     * Send reset password email
     */
    async sendResetPasswordEmail(
        to: string,
        name: string,
        newPassword: string,
        priority: number = 0
    ): Promise<string> {
        try {
            await this.getQueueClient().addMailJob(
                MailJobType.RESET_PASSWORD,
                to,
                'Your password has been reset',
                MAIL_TEMPLATES.RESET_PASSWORD,
                {
                    name,
                    newPassword,
                },
                { priority }
            );
            logger.info('Reset password email queued', 'EmailService', { to });
            return `reset-password-${Date.now()}`;
        } catch (error) {
            logger.error('Failed to queue reset password email', 'EmailService', { to, error });
            throw error;
        }
    }

    /**
     * Send assessment invitation email
     */
    async sendAssessmentInvitationEmail(
        to: string,
        userName: string,
        assessmentData: {
            assessmentId: string;
            assessmentTitle: string;
            assessmentDescription?: string;
            assessmentType: string;
            duration: number;
            totalMarks?: number;
            totalQuestions?: number;
            startDate?: Date;
            endDate?: Date;
            instruction?: string;
            assessmentUrl: string;
            dashboardUrl?: string;
            collegeName?: string;
            courseName?: string;
            year?: number;
            branchName?: string;
            customMessage?: string;
        },
        isRegistered: boolean = true,
        priority: number = 0
    ): Promise<string> {
        try {
            const enrichedAssessmentData = {
                ...assessmentData,
                dashboardUrl: assessmentData.dashboardUrl || this.getDashboardUrl(),
                appName: this.getAppName(),
                appUrl: this.getAppUrl(),
                helpUrl: this.getHelpUrl(),
                supportEmail: this.getSupportEmail(),
            };

            const template = isRegistered
                ? MAIL_TEMPLATES.ASSESSMENT_INVITATION_REGISTERED
                : MAIL_TEMPLATES.ASSESSMENT_INVITATION_UNREGISTERED;

            await this.getQueueClient().addMailJob(
                MailJobType.ASSESSMENT_INVITATION,
                to,
                `Assessment Invitation: ${assessmentData.assessmentTitle}`,
                template,
                {
                    userName,
                    userEmail: to,
                    isRegistered,
                    ...enrichedAssessmentData,
                },
                { priority }
            );
            logger.info('Assessment invitation email queued', 'EmailService', {
                to,
                assessmentId: assessmentData.assessmentId,
                isRegistered
            });
            return `assessment-invitation-${assessmentData.assessmentId}-${Date.now()}`;
        } catch (error) {
            logger.error('Failed to queue assessment invitation email', 'EmailService', {
                to,
                assessmentId: assessmentData.assessmentId,
                error
            });
            throw error;
        }
    }

    /**
     * Send custom email
     */
    async sendCustomEmail(
        to: string,
        subject: string,
        html: string,
        priority: number = 0,
        options: CustomEmailOptions = {}
    ): Promise<string> {
        try {
            const notificationId = options.notificationId || this.generateNotificationId('system');
            const message = options.message || this.stripHtml(html) || subject;
            const priorityLabel = this.mapPriority(priority, options.priorityLabel);
            const category = options.category || 'info';

            await this.getQueueClient().addMailJob(
                MailJobType.SYSTEM_NOTIFICATION,
                to,
                subject,
                MAIL_TEMPLATES.SYSTEM_NOTIFICATION,
                {
                    userEmail: to,
                    notificationId,
                    title: subject,
                    message,
                    category,
                    priority: priorityLabel,
                    actionRequired: Boolean(options.actionUrl),
                    actionText: options.actionText,
                    actionUrl: options.actionUrl,
                    dashboardUrl: this.getDashboardUrl(),
                    helpUrl: this.getHelpUrl(),
                    appName: this.getAppName(),
                    appDomain: this.getAppDomain(),
                    appUrl: this.getAppUrl(),
                    supportEmail: this.getSupportEmail(),
                    customHtml: html,
                    metadata: options.metadata
                },
                { priority }
            );
            logger.info('Custom email queued', 'EmailService', { to, subject, notificationId });
            return notificationId;
        } catch (error) {
            logger.error('Failed to queue custom email', 'EmailService', { to, subject, error });
            throw error;
        }
    }

    /**
     * Send bulk emails
     */
    async sendBulkEmails(
        emails: Array<{
            to: string;
            subject: string;
            html: string;
            priority?: number;
        }>
    ): Promise<string[]> {
        const jobIds: string[] = [];

        try {
            for (const email of emails) {
                const jobId = await this.sendCustomEmail(
                    email.to,
                    email.subject,
                    email.html,
                    email.priority || 0
                );
                jobIds.push(jobId);
            }

            logger.info('Bulk emails queued successfully', 'EmailService', {
                count: emails.length,
                jobIds: jobIds.length
            });

            return jobIds;
        } catch (error) {
            logger.error('Failed to queue bulk emails', 'EmailService', {
                count: emails.length,
                error
            });
            throw error;
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(): Promise<any> {
        try {
            const mailStats = await this.getQueueClient().getQueueStats('mail-queue');
            return {
                mail: mailStats,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Failed to get queue stats', 'EmailService', { error });
            return {
                mail: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Get job status by ID
     */
    getJobStatus(jobId: string): any {
        // This would need to be implemented with actual job tracking
        // For now, return a placeholder
        return {
            jobId,
            status: 'queued',
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Cancel a job by ID
     */
    async cancelJob(jobId: string): Promise<boolean> {
        try {
            // This would need to be implemented with actual job cancellation
            // For now, return false as jobs can't be cancelled
            logger.warn('Job cancellation not implemented', 'EmailService', { jobId });
            return false;
        } catch (error) {
            logger.error('Failed to cancel job', 'EmailService', { jobId, error });
            return false;
        }
    }

    /**
     * Get email service status
     */
    getEmailServiceStatus(): { status: string; queueReady: boolean } {
        return {
            status: 'active',
            queueReady: this.getQueueClient().isReady(),
        };
    }

    /**
     * Check if email service is ready
     */
    isReady(): boolean {
        return this.getQueueClient().isReady();
    }

    /**
     * Generate verification URL
     */
    generateVerificationUrl(token: string): string {
        const baseUrl = this.getAppUrl();
        return `${baseUrl}/verify-email?token=${token}`;
    }

    /**
     * Generate password reset URL
     */
    generatePasswordResetUrl(token: string): string {
        const baseUrl = this.getAppUrl();
        return `${baseUrl}/reset-password?token=${token}`;
    }

    /**
     * Generate registration URL
     */
    generateRegistrationUrl(): string {
        const baseUrl = this.getAppUrl();
        return `${baseUrl}/register`;
    }

    /**
     * Generate login URL
     */
    generateLoginUrl(): string {
        const baseUrl = this.getAppUrl();
        return `${baseUrl}/login`;
    }

    /**
     * Send registration invitation email
     */
    async sendRegistrationInvitation(
        email: string,
        data: {
            name: string;
            registrationUrl: string;
            customMessage?: string;
        }
    ): Promise<string> {
        try {
            const html = `
                <h2>You're invited to join place value Portal </h2>
                <p>Hello ${data.name},</p>
                <p>${data.customMessage || 'You have been invited to join our platform.'}</p>
                <p>Click the link below to register:</p>
                <a href="${data.registrationUrl}">Register Now</a>
            `;

            return await this.sendCustomEmail(
                email,
                'You\'re invited to join place value Portal ',
                html,
                0,
                {
                    notificationId: this.generateNotificationId('invite'),
                    category: 'success',
                    priorityLabel: 'normal',
                    actionUrl: data.registrationUrl,
                    actionText: 'Register now',
                    message: data.customMessage || 'You have been invited to join our platform.'
                }
            );
        } catch (error) {
            logger.error('Failed to send registration invitation', 'EmailService', { email, error });
            throw error;
        }
    }

    /**
     * Send coding test assignment email
     */
    async sendTestAssignmentEmail(
        email: string,
        data: {
            userName: string;
            testId: string;
            testTitle: string;
            difficulty?: string;
            tags?: string[];
            reason?: 'created' | 'updated';
            priority?: number;
        }
    ): Promise<string> {
        try {
            const testUrl = `${this.getAppUrl().replace(/\/$/, '')}/dashboard/tests/${data.testId}`;
            const subject = data.reason === 'updated'
                ? `You've been added to a test: ${data.testTitle}`
                : `New test assigned: ${data.testTitle}`;
            const difficultyLabel = data.difficulty ? data.difficulty.toUpperCase() : 'Coding Test';
            const tagsHtml = data.tags && data.tags.length > 0
                ? `<p style="margin:8px 0;"><strong>Tags:</strong> ${data.tags.join(', ')}</p>`
                : '';

            const html = `
                <h2 style="margin-bottom: 10px;">Hi ${data.userName || 'there'},</h2>
                <p style="margin: 0 0 12px;">
                    ${data.reason === 'updated'
                    ? 'You have been added to an existing coding test.'
                    : 'A new coding test has been assigned to you.'}
                </p>
                <p style="margin: 0 0 6px;">
                    <strong>${data.testTitle}</strong> &nbsp;•&nbsp; ${difficultyLabel}
                </p>
                ${tagsHtml}
                <p style="margin: 16px 0;">
                    Click the button below to review the details and start the test.
                </p>
                <p style="margin: 20px 0;">
                    <a href="${testUrl}" style="background:#4f46e5;color:#ffffff;padding:12px 28px;border-radius:999px;text-decoration:none;display:inline-block;">
                        View Test
                    </a>
                </p>
            `;

            return await this.sendCustomEmail(
                email,
                subject,
                html,
                data.priority ?? 50,
                {
                    notificationId: this.generateNotificationId('test-assignment'),
                    category: 'info',
                    priorityLabel: this.mapPriority(data.priority ?? 50),
                    actionUrl: testUrl,
                    actionText: 'Open test',
                    message: `${data.testTitle} (${difficultyLabel}) has been assigned to you.`,
                    metadata: {
                        testId: data.testId,
                        difficulty: data.difficulty,
                        tags: data.tags,
                        reason: data.reason
                    }
                }
            );
        } catch (error) {
            logger.error('Failed to send test assignment email', 'EmailService', { email, error });
            throw error;
        }
    }

    async sendAssessmentCompletion(data: AssessmentCompletionEmailPayload): Promise<string> {
        try {
            const resultUrl = data.resultUrl || this.buildResultUrl(data.resultId, data.assessmentId);
            const durationMinutes = Math.max(1, Math.ceil(data.durationSeconds / 60));
            const timeLimit = data.assessmentDurationMinutes || durationMinutes;

            await this.getQueueClient().addMailJob(
                MailJobType.ASSESSMENT_RESULT,
                data.userEmail,
                `Assessment Completed: ${data.assessmentTitle}`,
                MAIL_TEMPLATES.ASSESSMENT_RESULT,
                {
                    userName: data.userName,
                    userEmail: data.userEmail,
                    registrationNo: data.registrationNo,
                    assessmentId: data.assessmentId,
                    assessmentTitle: data.assessmentTitle,
                    assessmentType: data.assessmentType || 'Assessment',
                    totalMarks: data.totalMarks,
                    obtainedMarks: data.obtainedMarks,
                    percentage: data.percentage,
                    correctAnswers: data.correctAnswers ?? 0,
                    incorrectAnswers: data.incorrectAnswers ?? 0,
                    unattemptedQuestions: data.unattemptedQuestions ?? 0,
                    timeTaken: durationMinutes,
                    timeLimit,
                    submittedAt: data.submittedAt,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    resultUrl,
                    dashboardUrl: data.dashboardUrl || this.getDashboardUrl(),
                    certificateUrl: data.certificateUrl,
                    leaderboardUrl: data.leaderboardUrl,
                    appName: this.getAppName(),
                    appUrl: this.getAppUrl(),
                    supportEmail: this.getSupportEmail(),
                    helpUrl: this.getHelpUrl(),
                    isPassed: data.isPassed,
                    passingPercentage: data.passPercentage,
                    feedback: data.feedback,
                    recommendations: data.recommendations || []
                }
            );

            const jobId = `assessment-result-${Date.now()}`;
            logger.info(`Assessment completion email queued for ${data.userEmail}`, 'EmailService', { jobId });
            return jobId;
        } catch (error) {
            logger.error(`Failed to queue assessment completion email for ${data.userEmail}`, 'EmailService', { error });
            throw error;
        }
    }

    async sendIndividualAssessmentReport(email: string, reportData: any): Promise<string> {
        try {
            await this.getQueueClient().addMailJob(
                MailJobType.SYSTEM_NOTIFICATION,
                email,
                'Individual Assessment Report',
                MAIL_TEMPLATES.INDIVIDUAL_ASSESSMENT_REPORT,
                {
                    userEmail: email,
                    notificationId: this.generateNotificationId('assessment-report'),
                    title: 'Individual Assessment Report',
                    message: `Detailed report for ${reportData?.assessment?.title || 'your assessment'}`,
                    category: 'info',
                    priority: 'normal',
                    actionRequired: false,
                    dashboardUrl: this.getDashboardUrl(),
                    helpUrl: this.getHelpUrl(),
                    appName: this.getAppName(),
                    appUrl: this.getAppUrl(),
                    appDomain: this.getAppDomain(),
                    supportEmail: this.getSupportEmail(),
                    report: {
                        ...reportData,
                        appName: this.getAppName(),
                        helpUrl: this.getHelpUrl()
                    }
                }
            );
            const jobId = `assessment-report-${Date.now()}`;

            logger.info(`Individual assessment report email queued for ${email}`, 'EmailService', { jobId });
            return jobId;
        } catch (error) {
            logger.error(`Failed to queue individual assessment report email for ${email}`, 'EmailService', { error });
            throw error;
        }
    }
}

export default EmailService;
export const emailService = new EmailService();
