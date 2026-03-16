import { Request, Response } from 'express';
import { simpleRequestQueue } from '../middleware/simple-queue.middleware';
import { authRateLimiter } from '../middleware/rate-limiter.middleware';
import logger from '@repo/logger';

export class QueueController {
    /**
     * Get queue statistics
     */
    getStats = async (req: Request, res: Response) => {
        try {
            const queueStats = simpleRequestQueue.getStats();
            const rateLimitStats = authRateLimiter.getStats();

            logger.api('Queue stats requested', 'QueueController', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.json({
                success: true,
                data: {
                    queue: queueStats,
                    rateLimit: rateLimitStats,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime()
                }
            });
        } catch (error) {
            logger.error('Error getting queue stats', 'QueueController', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get queue statistics'
            });
        }
    };

    /**
     * Get queue health status
     */
    getHealth = async (req: Request, res: Response) => {
        try {
            const queueStats = simpleRequestQueue.getStats();

            // Determine health status
            let status = 'healthy';
            let message = 'Queue is operating normally';

            if (queueStats.currentQueueSize > queueStats.maxQueueSize * 0.8) {
                status = 'warning';
                message = 'Queue is near capacity';
            }

            if (queueStats.currentQueueSize >= queueStats.maxQueueSize) {
                status = 'critical';
                message = 'Queue is at capacity - requests may be rejected';
            }

            if (queueStats.currentProcessing >= queueStats.maxConcurrent * 0.9) {
                status = 'warning';
                message = 'High processing load';
            }

            res.json({
                success: true,
                data: {
                    status,
                    message,
                    ...queueStats,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Error getting queue health', 'QueueController', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get queue health status'
            });
        }
    };
}

export const queueController = new QueueController();
