import { Request, Response, NextFunction } from 'express';
import logger from '@repo/logger';
import { getLeakyBucketService } from '../core/services/LeakyBucketService';

export interface LeakyBucketRequest extends Request {
    leakyBucketId?: string;
    requestPriority?: number;
}

/**
 * Leaky Bucket Middleware for request rate limiting and queuing
 */
export class LeakyBucketMiddleware {
    private leakyBucket = getLeakyBucketService();

    /**
     * Main middleware function
     */
    middleware = (options: {
        priority?: (req: Request) => number;
        skipPaths?: string[];
        timeoutMs?: number;
    } = {}) => {
        return async (req: LeakyBucketRequest, res: Response, next: NextFunction) => {
            try {
                // Skip certain paths
                if (options.skipPaths?.includes(req.path)) {
                    return next();
                }

                // Determine request priority
                const priority = options.priority ? options.priority(req) : this.getDefaultPriority(req);
                req.requestPriority = priority;

                // Create a promise that will be resolved when the request is processed
                const processRequest = () => {
                    return new Promise((resolve, reject) => {
                        // Store original methods
                        const originalSend = res.send.bind(res);
                        const originalJson = res.json.bind(res);
                        const originalEnd = res.end.bind(res);

                        let responseSent = false;

                        // Override response methods to prevent multiple responses
                        res.send = function (data: any) {
                            if (!responseSent) {
                                responseSent = true;
                                originalSend(data);
                                resolve(data);
                            }
                            return res;
                        };

                        res.json = function (data: any) {
                            if (!responseSent) {
                                responseSent = true;
                                originalJson(data);
                                resolve(data);
                            }
                            return res;
                        };

                        res.end = function (data?: any) {
                            if (!responseSent) {
                                responseSent = true;
                                originalEnd(data);
                                resolve(data);
                            }
                            return res;
                        };

                        // Handle errors
                        res.on('error', (error) => {
                            if (!responseSent) {
                                responseSent = true;
                                reject(error);
                            }
                        });

                        // Continue to next middleware
                        next();
                    });
                };

                // Add request to leaky bucket
                await this.leakyBucket.addRequest(
                    processRequest,
                    priority,
                    options.timeoutMs || 30000
                );

            } catch (error: any) {
                logger.error('Leaky bucket middleware error', 'LeakyBucketMiddleware', {
                    error: error.message,
                    path: req.path,
                    method: req.method
                });

                // Send rate limit error
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: 'Request rate limit exceeded. Please try again later.',
                    retryAfter: 1,
                    timestamp: new Date().toISOString()
                });
            }
        };
    };

    /**
     * Get default priority based on request characteristics
     */
    private getDefaultPriority(req: Request): number {
        // Higher number = higher priority
        let priority = 1;

        // Health check endpoints get highest priority
        if (req.path === '/status' || req.path === '/health') {
            priority = 10;
        }
        // Authentication endpoints get high priority
        else if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
            priority = 8;
        }
        // GET requests get medium priority
        else if (req.method === 'GET') {
            priority = 5;
        }
        // POST requests get medium priority
        else if (req.method === 'POST') {
            priority = 3;
        }
        // PUT/PATCH requests get lower priority
        else if (req.method === 'PUT' || req.method === 'PATCH') {
            priority = 2;
        }
        // DELETE requests get lowest priority
        else if (req.method === 'DELETE') {
            priority = 1;
        }

        return priority;
    }

    /**
     * Get leaky bucket statistics
     */
    getStats() {
        return this.leakyBucket.getStats();
    }

    /**
     * Update leaky bucket configuration
     */
    updateConfig(config: {
        capacity?: number;
        leakRate?: number;
        maxWaitTime?: number;
        burstAllowance?: number;
    }) {
        this.leakyBucket.updateConfig(config);
    }

    /**
     * Clear the request queue
     */
    clearQueue() {
        this.leakyBucket.clearQueue();
    }
}

// Export singleton instance
export const leakyBucketMiddleware = new LeakyBucketMiddleware();
