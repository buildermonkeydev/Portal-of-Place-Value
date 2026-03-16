import { Request, Response } from 'express';
import { leakyBucketMiddleware } from '../middleware/leaky-bucket.middleware';
import logger from '@repo/logger';

export class LeakyBucketController {
    /**
     * Get leaky bucket statistics
     */
    getStats = async (req: Request, res: Response) => {
        try {
            const stats = leakyBucketMiddleware.getStats();

            logger.api('Leaky bucket stats requested', 'LeakyBucketController', {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.json({
                success: true,
                data: {
                    ...stats,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime()
                }
            });
        } catch (error) {
            logger.error('Error getting leaky bucket stats', 'LeakyBucketController', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get leaky bucket statistics'
            });
        }
    };

    /**
     * Update leaky bucket configuration
     */
    updateConfig = async (req: Request, res: Response) => {
        try {
            const { capacity, leakRate, maxWaitTime, burstAllowance } = req.body;

            // Validate input
            if (capacity && (capacity < 1 || capacity > 10000)) {
                return res.status(400).json({
                    success: false,
                    error: 'Capacity must be between 1 and 10000'
                });
            }

            if (leakRate && (leakRate < 1 || leakRate > 1000)) {
                return res.status(400).json({
                    success: false,
                    error: 'Leak rate must be between 1 and 1000'
                });
            }

            if (maxWaitTime && (maxWaitTime < 1000 || maxWaitTime > 300000)) {
                return res.status(400).json({
                    success: false,
                    error: 'Max wait time must be between 1000ms and 300000ms'
                });
            }

            if (burstAllowance && (burstAllowance < 1 || burstAllowance > 5000)) {
                return res.status(400).json({
                    success: false,
                    error: 'Burst allowance must be between 1 and 5000'
                });
            }

            // Update configuration
            leakyBucketMiddleware.updateConfig({
                capacity,
                leakRate,
                maxWaitTime,
                burstAllowance
            });

            logger.info('Leaky bucket configuration updated', 'LeakyBucketController', {
                capacity,
                leakRate,
                maxWaitTime,
                burstAllowance,
                updatedBy: req.ip
            });

            res.json({
                success: true,
                message: 'Leaky bucket configuration updated successfully',
                data: leakyBucketMiddleware.getStats()
            });
        } catch (error) {
            logger.error('Error updating leaky bucket config', 'LeakyBucketController', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to update leaky bucket configuration'
            });
        }
    };

    /**
     * Clear the request queue
     */
    clearQueue = async (req: Request, res: Response) => {
        try {
            leakyBucketMiddleware.clearQueue();

            logger.warn('Leaky bucket queue cleared', 'LeakyBucketController', {
                clearedBy: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.json({
                success: true,
                message: 'Request queue cleared successfully',
                data: leakyBucketMiddleware.getStats()
            });
        } catch (error) {
            logger.error('Error clearing leaky bucket queue', 'LeakyBucketController', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to clear request queue'
            });
        }
    };

    /**
     * Get queue health status
     */
    getHealth = async (req: Request, res: Response) => {
        try {
            const stats = leakyBucketMiddleware.getStats();

            // Determine health status
            let status = 'healthy';
            let message = 'Leaky bucket is operating normally';

            if (stats.currentQueueSize > stats.bucketCapacity * 0.8) {
                status = 'warning';
                message = 'Queue is near capacity';
            }

            if (stats.currentQueueSize >= stats.bucketCapacity) {
                status = 'critical';
                message = 'Queue is at capacity - requests may be rejected';
            }

            if (stats.averageWaitTime > 10000) {
                status = 'warning';
                message = 'Average wait time is high';
            }

            res.json({
                success: true,
                data: {
                    status,
                    message,
                    ...stats,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            logger.error('Error getting leaky bucket health', 'LeakyBucketController', { error });
            res.status(500).json({
                success: false,
                error: 'Failed to get leaky bucket health status'
            });
        }
    };
}

export const leakyBucketController = new LeakyBucketController();
