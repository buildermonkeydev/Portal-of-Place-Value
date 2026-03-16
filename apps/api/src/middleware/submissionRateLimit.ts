import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ResponseUtils } from '../utils/responseUtils';

/**
 * Rate limiter specifically for code submissions
 * Prevents DOS attacks by limiting submissions per user per minute
 */
export const submissionRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 10, // Maximum 10 submissions per minute per user
    message: 'Too many code submissions. Please wait before submitting again.',

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
        ResponseUtils.error(res,
            'Rate limit exceeded. Maximum 10 submissions per minute allowed.',
            429
        );
    },

    // Store in memory (for production, consider Redis store)
    // store: new RedisStore({ client: redisClient }) // TODO: Use Redis for distributed systems
});

/**
 * Additional global submission validation middleware
 */
export const validateSubmission = (req: Request, res: Response, next: NextFunction) => {
    const { sourceCode, languageId } = req.body;

    // Basic validation
    if (!sourceCode || !languageId) {
        return ResponseUtils.badRequest(res, 'sourceCode and languageId are required');
    }

    if (typeof sourceCode !== 'string') {
        return ResponseUtils.badRequest(res, 'sourceCode must be a string');
    }

    if (typeof languageId !== 'number') {
        return ResponseUtils.badRequest(res, 'languageId must be a number');
    }

    next();
};
