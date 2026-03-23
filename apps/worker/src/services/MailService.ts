import nodemailer from "nodemailer";
import * as Handlebars from 'handlebars';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import logger from '@repo/logger';
import { MailJobData, MailJobType } from '../types/queue.types';
import { MAIL_TEMPLATES } from '../types/queue.types';

export interface MailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}

export class MailService {
    private transporter: nodemailer.Transporter;
    private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
    private config: MailConfig;

    constructor(config: MailConfig) {
        this.config = config;
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.auth,
        });

        this.loadTemplates();
    }

    /**
     * Load email templates
     */
    private loadTemplates(): void {
        try {
            const templatesDir = join(__dirname, '../templates');
            const templateFiles = readdirSync(templatesDir).filter(file => file.endsWith('.hbs'));

            if (templateFiles.length === 0) {
                throw new Error('No email templates found');
            }

            templateFiles.forEach(file => {
                const templateName = file.replace('.hbs', '');
                const templateContent = readFileSync(join(templatesDir, file), 'utf8');
                this.templates.set(templateName, Handlebars.compile(templateContent));
            });

            logger.info('Email templates loaded successfully', 'MailService', {
                templateCount: templateFiles.length,
                templates: templateFiles,
            });
        } catch (error) {
            logger.error('Failed to load email templates', 'MailService', { error });
            throw error;
        }
    }

    /**
     * Send email
     */
    public async sendEmail(jobData: MailJobData): Promise<void> {
        try {
            let template = this.templates.get(jobData.template);
            if (!template) {
                logger.warn(`Template ${jobData.template} not found. Falling back to system-notification template.`, 'MailService');
                template = this.templates.get(MAIL_TEMPLATES.SYSTEM_NOTIFICATION);
            }

            const fallbackTemplate = () => {
                const fallbackMessage = (jobData.data as any)?.message || 'This is an automated notification.';
                return `
                    <html>
                        <body style="font-family: Arial, sans-serif; padding: 16px;">
                            <h2 style="margin-bottom: 8px;">${jobData.subject}</h2>
                            <p>${fallbackMessage}</p>
                        </body>
                    </html>
                `;
            };

            const html = template
                ? template(jobData.data)
                : fallbackTemplate();

            const mailOptions = {
                from: this.config.from,
                to: jobData.to,
                subject: jobData.subject,
                html,
            };

            const result = await this.transporter.sendMail(mailOptions);

            logger.info('Email sent successfully', 'MailService', {
                messageId: result.messageId,
                to: jobData.to,
                subject: jobData.subject,
                template: jobData.template,
            });
        } catch (error) {
            logger.error('Failed to send email', 'MailService', {
                error,
                to: jobData.to,
                subject: jobData.subject,
                template: jobData.template,
            });
            throw error;
        }
    }

    /**
     * Send registration email
     */
    public async sendRegistrationEmail(
        to: string,
        name: string,
        verificationLink: string
    ): Promise<void> {
        await this.sendEmail({
            type: MailJobType.REGISTER,
            to,
            subject: 'Welcome! Please verify your email',
            template: MAIL_TEMPLATES.REGISTER,
            data: {
                name,
                verificationLink,
            },
            createdAt: new Date(),
            metadata: {
                priority: 0,
                retryCount: 0,
                maxRetries: 3,
                source: 'mail-service'
            }
        });
    }

    /**
     * Send forgot password email
     */
    public async sendForgotPasswordEmail(
        to: string,
        name: string,
        resetLink: string
    ): Promise<void> {
        await this.sendEmail({
            type: MailJobType.FORGOT_PASSWORD,
            to,
            subject: 'Reset your password',
            template: MAIL_TEMPLATES.FORGOT_PASSWORD,
            data: {
                name,
                resetLink,
            },
            createdAt: new Date(),
            metadata: {
                priority: 0,
                retryCount: 0,
                maxRetries: 3,
                source: 'mail-service'
            }
        });
    }

    /**
     * Send reset password email
     */
    public async sendResetPasswordEmail(
        to: string,
        name: string,
        newPassword: string
    ): Promise<void> {
        await this.sendEmail({
            type: MailJobType.RESET_PASSWORD,
            to,
            subject: 'Your password has been reset',
            template: MAIL_TEMPLATES.RESET_PASSWORD,
            data: {
                name,
                newPassword,
            },
            createdAt: new Date(),
            metadata: {
                priority: 0,
                retryCount: 0,
                maxRetries: 3,
                source: 'mail-service'
            }
        });
    }

    /**
     * Send welcome email
     */
    public async sendWelcomeEmail(
        to: string,
        name: string
    ): Promise<void> {
        await this.sendEmail({
            type: MailJobType.WELCOME,
            to,
            subject: 'Welcome to place value Portal !',
            template: MAIL_TEMPLATES.WELCOME,
            data: {
                name,
            },
            createdAt: new Date(),
            metadata: {
                priority: 0,
                retryCount: 0,
                maxRetries: 3,
                source: 'mail-service'
            }
        });
    }

    /**
     * Verify email configuration
     */
    public async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            logger.info('Email service connection verified', 'MailService');
            return true;
        } catch (error) {
            logger.error('Email service connection failed', 'MailService', { error });
            return false;
        }
    }
}
