import { Router } from 'express';
import { IRequest, IResponse } from '../core/types';
import { emailService } from '../core/services/EmailService';
import { logger } from '../utils/logger';
const router: Router = Router();

// Get mail queue statistics (admin only)
router.get('/stats', async (req: IRequest, res: IResponse): Promise<void> => {
    try {
        const stats = emailService.getQueueStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Failed to get mail queue stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get mail queue statistics'
        });
    }
});

// Get job status by ID (admin only)
router.get('/job/:jobId', async (req: IRequest, res: IResponse): Promise<void> => {
    try {
        const jobId = req.params['jobId'];
        if (!jobId) {
            res.status(400).json({
                success: false,
                message: 'Job ID is required'
            });
            return;
        }

        const jobStatus = emailService.getJobStatus(jobId);

        if (!jobStatus) {
            res.status(404).json({
                success: false,
                message: 'Job not found'
            });
            return;
        }

        res.json({
            success: true,
            data: jobStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Failed to get job status for ${req.params['jobId']}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to get job status'
        });
    }
});

// Cancel a job (admin only)
router.post('/job/:jobId/cancel', async (req: IRequest, res: IResponse): Promise<void> => {
    try {
        const jobId = req.params['jobId'];
        if (!jobId) {
            res.status(400).json({
                success: false,
                message: 'Job ID is required'
            });
            return;
        }

        const cancelled = await emailService.cancelJob(jobId);

        if (!cancelled) {
            res.status(400).json({
                success: false,
                message: 'Job could not be cancelled (may not exist or already processing)'
            });
            return;
        }

        res.json({
            success: true,
            message: 'Job cancelled successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Failed to cancel job ${req.params['jobId']}:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel job'
        });
    }
});

// Send test email (admin only)
router.post('/test', async (req: IRequest, res: IResponse): Promise<void> => {
    try {
        const { email, subject, message } = req.body;

        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
            return;
        }

        const jobId = await emailService.sendCustomEmail(
            email,
            subject || 'Test Email from Mail Queue',
            message || '<p>This is a test email from the mail queue system.</p>'
        );

        res.json({
            success: true,
            message: 'Test email queued successfully',
            data: { jobId },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Failed to queue test email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to queue test email'
        });
    }
});

// Queue bulk emails (admin only)
router.post('/bulk', async (req: IRequest, res: IResponse): Promise<void> => {
    try {
        const { emails, subject, html, priority } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Emails array is required and must not be empty'
            });
            return;
        }

        if (!subject || !html) {
            res.status(400).json({
                success: false,
                message: 'Subject and HTML content are required'
            });
            return;
        }

        const jobIds: string[] = [];

        for (const email of emails) {
            const jobId = await emailService.sendCustomEmail(email, subject, html, priority);
            jobIds.push(jobId);
        }

        res.json({
            success: true,
            message: `Bulk emails queued successfully`,
            data: {
                jobIds,
                count: jobIds.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Failed to queue bulk emails:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to queue bulk emails'
        });
    }
});

export const mailQueueRoutes = router;
