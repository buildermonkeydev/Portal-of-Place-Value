/**
 * Professional Mail Processor
 * 
 * Handles all types of email jobs with comprehensive error handling,
 * retry logic, and type safety. Supports authentication, assessment,
 * system, and maintenance email types.
 * 
 * @author Senior Development Team
 * @version 2.0.0
 */

import { Job } from 'bullmq';
import { MailService } from '../services/MailService';
import logger from '@repo/logger';
import { getConfig } from '@repo/env-config';
import {
    MailJobData,
    MailJobType,
    AssessmentInvitationMailJobData,
    AssessmentResultMailJobData,
    AssessmentReminderMailJobData,
    SystemNotificationMailJobData,
    MaintenanceAlertMailJobData,
    isAssessmentInvitationMailJobData,
    isAssessmentResultMailJobData,
    isAssessmentReminderMailJobData,
    isSystemNotificationMailJobData,
    isMaintenanceAlertMailJobData,
    isAuthMailJobData,
    JobProcessingResult,
    AuthMailJobData
} from '../types/queue.types';

export class MailProcessor {
    private mailService: MailService;
    private config: ReturnType<typeof getConfig>;

    constructor(mailService: MailService) {
        this.mailService = mailService;
        this.config = getConfig();
    }

    /**
     * Main mail job processor with comprehensive error handling
     */
    public async processMailJob(job: Job<MailJobData>): Promise<JobProcessingResult> {
        const { type, to, subject, template, data, metadata } = job.data;

        try {
            logger.info(`Processing mail job: ${type}`, 'MailProcessor', {
                jobId: job.id,
                to: this.sanitizeEmail(to),
                subject,
                template,
                priority: metadata?.priority,
                retryCount: metadata?.retryCount || 0
            });

            // Validate required fields
            this.validateMailJobData(job.data);

            // Add app-specific data to template data
            const appConfig = this.config.getApp();
            const templateData = {
                ...data,
                appName: appConfig.name,
                appUrl: appConfig.url,
                appDomain: appConfig.domain,
                helpUrl: appConfig.helpUrl,
                supportEmail: this.config.getSMTP().user,
                timestamp: new Date().toISOString(),
                jobId: job.id
            };

            // Process based on job type
            let result: JobProcessingResult;

            if (isAssessmentInvitationMailJobData(job.data)) {
                result = await this.processAssessmentInvitation(job as Job<AssessmentInvitationMailJobData>);
            } else if (isAssessmentResultMailJobData(job.data)) {
                result = await this.processAssessmentResult(job as Job<AssessmentResultMailJobData>);
            } else if (isAssessmentReminderMailJobData(job.data)) {
                result = await this.processAssessmentReminder(job as Job<AssessmentReminderMailJobData>);
            } else if (isSystemNotificationMailJobData(job.data)) {
                result = await this.processSystemNotification(job as Job<SystemNotificationMailJobData>);
            } else if (isMaintenanceAlertMailJobData(job.data)) {
                result = await this.processMaintenanceAlert(job as Job<MaintenanceAlertMailJobData>);
            } else if (isAuthMailJobData(job.data)) {
                result = await this.processAuthEmail(job as Job<AuthMailJobData>);
            } else {
                result = await this.processGenericEmail(job, templateData);
            }

            logger.info(`Mail job completed successfully: ${type}`, 'MailProcessor', {
                jobId: job.id,
                to: this.sanitizeEmail(to),
                subject,
                success: result.success
            });

            return result;

        } catch (error) {
            const isRetryable = this.isRetryableError(error);
            const nextRetryAt = isRetryable ? this.calculateNextRetry(metadata?.retryCount || 0) : undefined;

            logger.error(`Mail job failed: ${type}`, 'MailProcessor', {
                jobId: job.id,
                error: error instanceof Error ? error.message : 'Unknown error',
                to: this.sanitizeEmail(to),
                subject,
                template,
                isRetryable,
                nextRetryAt
            });

            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                error: error instanceof Error ? error : new Error('Unknown error'),
                retryable: isRetryable,
                nextRetryAt
            };
        }
    }

    /**
     * Process assessment invitation emails
     */
    private async processAssessmentInvitation(job: Job<AssessmentInvitationMailJobData>): Promise<JobProcessingResult> {
        const { to, subject, template, data } = job.data;

        try {
            // Validate assessment invitation data
            this.validateAssessmentInvitationData(data);

            // Prepare template data with assessment-specific formatting
            const templateData = {
                ...data,
                formatDate: this.formatDate,
                formatDuration: this.formatDuration,
                formatPercentage: this.formatPercentage,
                isUrgent: this.isUrgentAssessment(data.endDate),
                timeRemaining: this.calculateTimeRemaining(data.endDate)
            };

            // Send email using appropriate template
            await this.mailService.sendEmail({
                ...job.data,
                data: templateData
            });

            logger.info('Assessment invitation email sent successfully', 'MailProcessor', {
                jobId: job.id,
                to: this.sanitizeEmail(to),
                assessmentId: data.assessmentId,
                assessmentTitle: data.assessmentTitle,
                isRegistered: data.isRegistered
            });

            return { success: true, message: 'Assessment invitation sent successfully' };

        } catch (error) {
            logger.error('Assessment invitation email failed', 'MailProcessor', {
                jobId: job.id,
                error,
                to: this.sanitizeEmail(to),
                assessmentId: data.assessmentId
            });
            throw error;
        }
    }

    /**
     * Process assessment result emails
     */
    private async processAssessmentResult(job: Job<AssessmentResultMailJobData>): Promise<JobProcessingResult> {
        const { to, subject, template, data } = job.data;

        try {
            // Validate assessment result data
            this.validateAssessmentResultData(data);

            // Prepare template data with result-specific formatting
            const templateData = {
                ...data,
                formatDate: this.formatDate,
                formatDuration: this.formatDuration,
                formatPercentage: this.formatPercentage,
                performanceLevel: this.getPerformanceLevel(data.percentage),
                isExcellent: data.percentage >= 90,
                isGood: data.percentage >= 70 && data.percentage < 90,
                isPassing: data.isPassed,
                needsImprovement: data.percentage < 70
            };

            await this.mailService.sendEmail({
                ...job.data,
                data: templateData
            });

            logger.info('Assessment result email sent successfully', 'MailProcessor', {
                jobId: job.id,
                to: this.sanitizeEmail(to),
                assessmentId: data.assessmentId,
                percentage: data.percentage,
                isPassed: data.isPassed
            });

            return { success: true, message: 'Assessment result sent successfully' };

        } catch (error) {
            logger.error('Assessment result email failed', 'MailProcessor', {
                jobId: job.id,
                error,
                to: this.sanitizeEmail(to),
                assessmentId: data.assessmentId
            });
            throw error;
        }
    }

    /**
     * Process assessment reminder emails
     */
    private async processAssessmentReminder(job: Job<AssessmentReminderMailJobData>): Promise<JobProcessingResult> {
        const { to, subject, template, data } = job.data;

        try {
            // Validate assessment reminder data
            this.validateAssessmentReminderData(data);

            // Prepare template data with reminder-specific formatting
            const templateData = {
                ...data,
                formatDate: this.formatDate,
                formatDuration: this.formatDuration,
                urgencyLevel: this.getUrgencyLevel(data.timeRemaining),
                isLastChance: data.isLastReminder,
                timeRemainingText: this.formatTimeRemaining(data.timeRemaining)
            };

            await this.mailService.sendEmail({
                ...job.data,
                data: templateData
            });

            logger.info('Assessment reminder email sent successfully', 'MailProcessor', {
                jobId: job.id,
                to: this.sanitizeEmail(to),
                assessmentId: data.assessmentId,
                reminderType: data.reminderType,
                timeRemaining: data.timeRemaining
            });

            return { success: true, message: 'Assessment reminder sent successfully' };

        } catch (error) {
            logger.error('Assessment reminder email failed', 'MailProcessor', {
                jobId: job.id,
                error,
                to: this.sanitizeEmail(to),
                assessmentId: data.assessmentId
            });
            throw error;
        }
    }

    /**
     * Process system notification emails
     */
    private async processSystemNotification(job: Job<SystemNotificationMailJobData>): Promise<JobProcessingResult> {
        const { to, subject, template, data } = job.data;

        try {
            // Validate system notification data
            this.validateSystemNotificationData(data);

            // Prepare template data with system-specific formatting
            const templateData = {
                ...data,
                formatDate: this.formatDate,
                categoryIcon: this.getCategoryIcon(data.category),
                priorityColor: this.getPriorityColor(data.priority as any),
                hasAction: data.actionRequired,
                isUrgent: data.priority === 'urgent'
            };

            await this.mailService.sendEmail({
                ...job.data,
                data: templateData
            });

            logger.info('System notification email sent successfully', 'MailProcessor', {
                jobId: job.id,
                to: this.sanitizeEmail(to),
                notificationId: data.notificationId,
                category: data.category,
                priority: data.priority
            });

            return { success: true, message: 'System notification sent successfully' };

        } catch (error) {
            logger.error('System notification email failed', 'MailProcessor', {
                jobId: job.id,
                error,
                to: this.sanitizeEmail(to),
                notificationId: data.notificationId
            });
            throw error;
        }
    }

    /**
     * Process maintenance alert emails
     */
    private async processMaintenanceAlert(job: Job<MaintenanceAlertMailJobData>): Promise<JobProcessingResult> {
        const { to, subject, template, data } = job.data;

        try {
            // Validate maintenance alert data
            this.validateMaintenanceAlertData(data);

            // Prepare template data with maintenance-specific formatting
            const templateData = {
                ...data,
                formatDate: this.formatDate,
                formatDuration: this.formatDuration,
                typeIcon: this.getMaintenanceTypeIcon(data.type),
                priorityColor: this.getPriorityColor(data.priority),
                impactLevel: data.impactLevel, // Keep original type for template
                impactLevelText: this.getImpactLevelText(data.impactLevel as 'minimal' | 'moderate' | 'significant' | 'complete'),
                isScheduled: data.type === 'scheduled',
                isEmergency: data.type === 'emergency',
                isCompleted: data.type === 'completed',
                isCancelled: data.type === 'cancelled'
            };

            await this.mailService.sendEmail({
                ...job.data,
                data: templateData
            });

            logger.info('Maintenance alert email sent successfully', 'MailProcessor', {
                jobId: job.id,
                to: this.sanitizeEmail(to),
                maintenanceId: data.maintenanceId,
                type: data.type,
                priority: data.priority
            });

            return { success: true, message: 'Maintenance alert sent successfully' };

        } catch (error) {
            logger.error('Maintenance alert email failed', 'MailProcessor', {
                jobId: job.id,
                error,
                to: this.sanitizeEmail(to),
                maintenanceId: data.maintenanceId
            });
            throw error;
        }
    }

    /**
     * Process authentication emails (legacy support)
     */
    private async processAuthEmail(job: Job<AuthMailJobData>): Promise<JobProcessingResult> {
        const { type, to, data } = job.data;

        try {
            switch (type) {
                case MailJobType.REGISTER:
                    await this.processRegistrationEmail(job);
                    break;
                case MailJobType.FORGOT_PASSWORD:
                    await this.processForgotPasswordEmail(job);
                    break;
                case MailJobType.RESET_PASSWORD:
                    await this.processResetPasswordEmail(job);
                    break;
                case MailJobType.WELCOME:
                    await this.processWelcomeEmail(job);
                    break;
                default:
                    throw new Error(`Unsupported auth email type: ${type}`);
            }

            return { success: true, message: `${type} email sent successfully` };

        } catch (error) {
            logger.error(`Auth email failed: ${type}`, 'MailProcessor', {
                jobId: job.id,
                error,
                to: this.sanitizeEmail(to)
            });
            throw error;
        }
    }

    /**
     * Process generic emails
     */
    private async processGenericEmail(job: Job<MailJobData>, templateData: any): Promise<JobProcessingResult> {
        try {
            await this.mailService.sendEmail({
                ...job.data,
                data: templateData
            });

            return { success: true, message: 'Email sent successfully' };

        } catch (error) {
            logger.error('Generic email failed', 'MailProcessor', {
                jobId: job.id,
                error,
                to: this.sanitizeEmail(job.data.to)
            });
            throw error;
        }
    }

    // ============================================================================
    // VALIDATION METHODS
    // ============================================================================

    private validateMailJobData(data: MailJobData): void {
        if (!data.to || !data.subject || !data.template) {
            throw new Error('Missing required fields: to, subject, or template');
        }

        if (!this.isValidEmail(data.to)) {
            throw new Error(`Invalid email address: ${data.to}`);
        }
    }

    private validateAssessmentInvitationData(data: AssessmentInvitationMailJobData['data']): void {
        if (!data.assessmentId || !data.assessmentTitle || !data.assessmentUrl) {
            throw new Error('Missing required assessment invitation fields');
        }
    }

    private validateAssessmentResultData(data: AssessmentResultMailJobData['data']): void {
        if (!data.assessmentId || !data.assessmentTitle || !data.resultUrl) {
            throw new Error('Missing required assessment result fields');
        }

        if (data.obtainedMarks < 0 || data.totalMarks <= 0) {
            throw new Error('Invalid assessment marks');
        }
    }

    private validateAssessmentReminderData(data: AssessmentReminderMailJobData['data']): void {
        if (!data.assessmentId || !data.assessmentTitle || !data.assessmentUrl) {
            throw new Error('Missing required assessment reminder fields');
        }

        if (!data.endDate || data.timeRemaining < 0) {
            throw new Error('Invalid assessment reminder timing');
        }
    }

    private validateSystemNotificationData(data: SystemNotificationMailJobData['data']): void {
        if (!data.notificationId || !data.title || !data.message) {
            throw new Error('Missing required system notification fields');
        }
    }

    private validateMaintenanceAlertData(data: MaintenanceAlertMailJobData['data']): void {
        if (!data.maintenanceId || !data.title || !data.description) {
            throw new Error('Missing required maintenance alert fields');
        }

        if (!data.startTime || !data.endTime || data.startTime >= data.endTime) {
            throw new Error('Invalid maintenance timing');
        }
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private sanitizeEmail(email: string): string {
        // Sanitize email for logging (hide sensitive parts)
        const [local, domain] = email.split('@');
        if (local.length > 2) {
            return `${local.substring(0, 2)}***@${domain}`;
        }
        return `***@${domain}`;
    }

    private isRetryableError(error: any): boolean {
        // Network errors, timeouts, and temporary failures are retryable
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return true;
        }

        // Rate limiting errors are retryable
        if (error.status === 429) {
            return true;
        }

        // Validation errors are not retryable
        if (error.message?.includes('Missing required') || error.message?.includes('Invalid')) {
            return false;
        }

        return true;
    }

    private calculateNextRetry(retryCount: number): Date {
        // Exponential backoff: 1min, 5min, 15min, 1hour, 4hours
        const delays = [1, 5, 15, 60, 240]; // in minutes
        const delay = delays[Math.min(retryCount, delays.length - 1)];
        return new Date(Date.now() + delay * 60 * 1000);
    }

    // ============================================================================
    // FORMATTING METHODS
    // ============================================================================

    private formatDate(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} minutes`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} hours`;
    }

    private formatPercentage(percentage: number): string {
        return `${percentage.toFixed(1)}%`;
    }

    private formatTimeRemaining(hours: number): string {
        if (hours < 1) {
            return 'Less than 1 hour';
        } else if (hours < 24) {
            return `${Math.floor(hours)} hours`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = Math.floor(hours % 24);
            return remainingHours > 0 ? `${days} days ${remainingHours} hours` : `${days} days`;
        }
    }

    // ============================================================================
    // ASSESSMENT-SPECIFIC METHODS
    // ============================================================================

    private isUrgentAssessment(endDate?: Date): boolean {
        if (!endDate) return false;
        const now = new Date();
        const timeDiff = endDate.getTime() - now.getTime();
        return timeDiff < 24 * 60 * 60 * 1000; // Less than 24 hours
    }

    private calculateTimeRemaining(endDate?: Date): number {
        if (!endDate) return 0;
        const now = new Date();
        const timeDiff = endDate.getTime() - now.getTime();
        return Math.max(0, Math.ceil(timeDiff / (60 * 60 * 1000))); // Hours
    }

    private getPerformanceLevel(percentage: number): string {
        if (percentage >= 90) return 'Excellent';
        if (percentage >= 80) return 'Very Good';
        if (percentage >= 70) return 'Good';
        if (percentage >= 60) return 'Satisfactory';
        return 'Needs Improvement';
    }

    private getUrgencyLevel(hoursRemaining: number): string {
        if (hoursRemaining < 1) return 'Critical';
        if (hoursRemaining < 6) return 'Urgent';
        if (hoursRemaining < 24) return 'High';
        if (hoursRemaining < 72) return 'Medium';
        return 'Low';
    }

    // ============================================================================
    // SYSTEM-SPECIFIC METHODS
    // ============================================================================

    private getCategoryIcon(category: string): string {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            success: '✅',
            error: '❌',
            update: '🔄'
        };
        return icons[category as keyof typeof icons] || '📢';
    }

    private getPriorityColor(priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical'): string {
        const colors = {
            low: '#10b981',
            normal: '#3b82f6',
            high: '#f59e0b',
            urgent: '#ef4444',
            critical: '#dc2626'
        };
        return colors[priority as keyof typeof colors] || '#6b7280';
    }

    private getMaintenanceTypeIcon(type: string): string {
        const icons = {
            scheduled: '📅',
            emergency: '🚨',
            completed: '✅',
            cancelled: '❌'
        };
        return icons[type as keyof typeof icons] || '🔧';
    }

    private getImpactLevelText(impactLevel: string): string {
        const levels = {
            minimal: 'Minimal Impact',
            moderate: 'Moderate Impact',
            significant: 'Significant Impact',
            complete: 'Complete Service Outage'
        };
        return levels[impactLevel as keyof typeof levels] || 'Unknown Impact';
    }

    // ============================================================================
    // LEGACY AUTH METHODS (for backward compatibility)
    // ============================================================================

    private async processRegistrationEmail(job: Job<AuthMailJobData>): Promise<void> {
        const { to, data } = job.data;
        const { name, verificationLink } = data;

        if (!name || !verificationLink) {
            throw new Error('Missing required data: name and verificationLink');
        }

        await this.mailService.sendRegistrationEmail(to, name, verificationLink);
    }

    private async processForgotPasswordEmail(job: Job<AuthMailJobData>): Promise<void> {
        const { to, data } = job.data;
        const { name, resetLink } = data;

        if (!name || !resetLink) {
            throw new Error('Missing required data: name and resetLink');
        }

        await this.mailService.sendForgotPasswordEmail(to, name, resetLink);
    }

    private async processResetPasswordEmail(job: Job<AuthMailJobData>): Promise<void> {
        const { to, data } = job.data;
        const { name, newPassword } = data;

        if (!name || !newPassword) {
            throw new Error('Missing required data: name and newPassword');
        }

        await this.mailService.sendResetPasswordEmail(to, name, newPassword);
    }

    private async processWelcomeEmail(job: Job<AuthMailJobData>): Promise<void> {
        const { to, data } = job.data;
        const { name } = data;

        if (!name) {
            throw new Error('Missing required data: name');
        }

        await this.mailService.sendWelcomeEmail(to, name);
    }
}