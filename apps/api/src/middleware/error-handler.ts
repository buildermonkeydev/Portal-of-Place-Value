import { INextFunction, IRequest, IResponse } from '../core/types';
import { ERROR_MESSAGES, ErrorHandler, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export const GlobalErrorHandler = (
    error: Error,
    req: IRequest,
    res: IResponse,
    next: INextFunction
): void => {
    if (res.headersSent) {
        return next(error);
    }

    try {
        logger.error('Unhandled error occurred', 'GlobalErrorHandler', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?._id,
            timestamp: new Date().toISOString(),
        });

        ErrorHandler.handleError(error, req, res);

    } catch (handlerError) {
        logger.error('Error handler failed', 'GlobalErrorHandler', {
            originalError: error.message,
            handlerError: handlerError instanceof Error ? handlerError.message : 'Unknown error',
        });

        res.status(500).json({
            success: false,
            error: {
                message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
                statusCode: 500,
                name: 'InternalServerError',
                timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
            path: req.url,
        });
    }
};

/**
 * 404 Not Found handler
 */
export const NotFoundHandler = (req: IRequest, res: IResponse, next: INextFunction): void => {
    const error = new NotFoundError(`Route ${req.method} ${req.url} not found`);

    logger.warn('Route not found', 'NotFoundHandler', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });

    ErrorHandler.handleError(error, req, res);
};

