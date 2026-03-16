import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ResponseUtils } from '../utils/responseUtils';

/**
 * Rate limiter specifically for export operations
 * Prevents abuse by limiting export requests per user per hour
 * Exports are resource-intensive operations that can generate large files
 */
export const exportRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // Maximum 5 exports per hour per user
    message: 'Too many export requests. Please wait before exporting again.',

    keyGenerator: (req: any) => {
        return req.user?._id || 'anonymous';
    },

    // Skip rate limiting for admin users
    skip: (req: any) => {
        return req.user?.role === 'admin';
    },

    // Standard headers
    standardHeaders: true,
    legacyHeaders: false,

    // Custom handler for rate limit exceeded
    handler: (req: Request, res: Response) => {
        ResponseUtils.error(
            res,
            'Rate limit exceeded. Maximum 5 export requests per hour allowed.',
            429,
            'RATE_LIMIT_EXCEEDED'
        );
    },

    // Store in memory (for production, consider Redis store)
    // store: new RedisStore({ client: redisClient }) // TODO: Use Redis for distributed systems
});

