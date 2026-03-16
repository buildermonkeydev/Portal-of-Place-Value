import { Request, Response, NextFunction } from 'express';
import logger from '@repo/logger';

interface RateLimiterConfig {
    windowMs: number;        // Time window in milliseconds
    maxRequests: number;     // Max requests per window
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

class RateLimiter {
    private requests: Map<string, number[]> = new Map();
    private config: RateLimiterConfig;

    constructor(config: RateLimiterConfig) {
        this.config = config;
        // Clean up old entries every minute
        setInterval(() => this.cleanup(), 60000);
    }

    middleware = () => {
        return (req: Request, res: Response, next: NextFunction) => {
            const key = this.getKey(req);
            const now = Date.now();
            const windowStart = now - this.config.windowMs;

            // Get or create request history for this key
            let requestHistory = this.requests.get(key) || [];

            // Remove old requests outside the window
            requestHistory = requestHistory.filter(timestamp => timestamp > windowStart);

            // Check if limit exceeded
            if (requestHistory.length >= this.config.maxRequests) {
                logger.warn('Rate limit exceeded', 'RateLimiter', {
                    key,
                    requests: requestHistory.length,
                    limit: this.config.maxRequests,
                    windowMs: this.config.windowMs
                });

                return res.status(429).json({
                    error: 'Too Many Requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    retryAfter: Math.ceil(this.config.windowMs / 1000),
                    timestamp: new Date().toISOString()
                });
            }

            // Add current request
            requestHistory.push(now);
            this.requests.set(key, requestHistory);

            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': this.config.maxRequests.toString(),
                'X-RateLimit-Remaining': Math.max(0, this.config.maxRequests - requestHistory.length).toString(),
                'X-RateLimit-Reset': new Date(now + this.config.windowMs).toISOString()
            });

            next();
        };
    };

    private getKey(req: Request): string {
        // Use IP address as key
        return req.ip || req.connection.remoteAddress || 'unknown';
    }

    private cleanup(): void {
        const now = Date.now();
        const cutoff = now - this.config.windowMs;

        for (const [key, requests] of this.requests.entries()) {
            const validRequests = requests.filter(timestamp => timestamp > cutoff);
            if (validRequests.length === 0) {
                this.requests.delete(key);
            } else {
                this.requests.set(key, validRequests);
            }
        }
    }

    getStats() {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        let totalRequests = 0;
        let activeKeys = 0;

        for (const requests of this.requests.values()) {
            const validRequests = requests.filter(timestamp => timestamp > windowStart);
            if (validRequests.length > 0) {
                totalRequests += validRequests.length;
                activeKeys++;
            }
        }

        return {
            totalRequests,
            activeKeys,
            windowMs: this.config.windowMs,
            maxRequests: this.config.maxRequests
        };
    }
}
export const authRateLimiter = new RateLimiter({
    windowMs: 60000,
    maxRequests: 999999999, // Effectively no rate limiting for load testing
    skipSuccessfulRequests: true,
    skipFailedRequests: false
});

export const generalRateLimiter = new RateLimiter({
    windowMs: 60000,
    maxRequests: 999999999, // Effectively no rate limiting for load testing
    skipSuccessfulRequests: true,
    skipFailedRequests: false
});

export const strictRateLimiter = new RateLimiter({
    windowMs: 60000,
    maxRequests: 999999999, // Effectively no rate limiting for load testing
    skipSuccessfulRequests: false,
    skipFailedRequests: false
});

export const rateLimitAuth = authRateLimiter.middleware();
export const rateLimitUserOperation = generalRateLimiter.middleware();