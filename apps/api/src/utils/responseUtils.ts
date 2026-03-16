import { IResponse } from "../core/types";
import { logger } from "../utils/logger"; // Make sure to import logger

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
    timestamp: string;
    error?: {
        code: string;
        details?: any;
    };
}

export class ResponseUtils {
    /**
     * Send success response
     */
    static success<T>(
        res: IResponse,
        data: T,
        message: string = 'Operation completed successfully',
        statusCode: number = 200,
        pagination?: ApiResponse<T>['pagination']
    ): void {
        // CRITICAL: Check if headers are already sent
        if (res.headersSent) {
            logger.warn('ResponseUtils.success: Headers already sent, cannot send response');
            return;
        }

        try {
            const response: ApiResponse<T> = {
                success: true,
                message,
                data,
                timestamp: new Date().toISOString(),
            };

            if (pagination) {
                response.pagination = pagination;
            }

            res.status(statusCode).json(response);
        } catch (error) {
            logger.error('ResponseUtils.success: Error sending response', error);
        }
    }

    /**
     * Send error response
     */
    static error(
        res: IResponse,
        message: string = 'Operation failed',
        statusCode: number = 500,
        errorCode?: string,
        errorDetails?: any
    ): void {
        // CRITICAL: Check if headers are already sent
        if (res.headersSent) {
            logger.warn('ResponseUtils.error: Headers already sent, cannot send error response');
            return;
        }

        try {
            const response: ApiResponse = {
                success: false,
                message,
                timestamp: new Date().toISOString(),
            };

            if (errorCode || errorDetails) {
                response.error = {
                    code: errorCode || 'INTERNAL_ERROR',
                    details: errorDetails,
                };
            }

            res.status(statusCode).json(response);
        } catch (error) {
            logger.error('ResponseUtils.error: Error sending error response', error);
        }
    }

    /**
     * Send not found response
     */
    static notFound(res: IResponse, message: string = 'Resource not found'): void {
        if (res.headersSent) return;
        this.error(res, message, 404, 'NOT_FOUND');
    }

    /**
     * Send bad request response
     */
    static badRequest(res: IResponse, message: string = 'Bad request', errorDetails?: any): void {
        if (res.headersSent) return;
        this.error(res, message, 400, 'BAD_REQUEST', errorDetails);
    }

    /**
     * Send unauthorized response
     */
    static unauthorized(res: IResponse, message: string = 'Unauthorized'): void {
        if (res.headersSent) return;
        this.error(res, message, 401, 'UNAUTHORIZED');
    }

    /**
     * Send forbidden response
     */
    static forbidden(res: IResponse, message: string = 'Forbidden'): void {
        if (res.headersSent) return;
        this.error(res, message, 403, 'FORBIDDEN');
    }

    /**
     * Send conflict response
     */
    static conflict(res: IResponse, message: string = 'Conflict', errorDetails?: any): void {
        if (res.headersSent) return;
        this.error(res, message, 409, 'CONFLICT', errorDetails);
    }

    /**
     * Send validation error response
     */
    static validationError(res: IResponse, message: string = 'Validation failed', errorDetails?: any): void {
        if (res.headersSent) return;
        this.error(res, message, 422, 'VALIDATION_ERROR', errorDetails);
    }

    /**
     * Send created response
     */
    static created<T>(res: IResponse, data: T, message: string = 'Resource created successfully'): void {
        if (res.headersSent) return;
        this.success(res, data, message, 201);
    }

    /**
     * Send no content response
     */
    static noContent(res: IResponse): void {
        if (res.headersSent) {
            logger.warn('ResponseUtils.noContent: Headers already sent');
            return;
        }
        res.status(204).send();
    }

    /**
     * Send paginated response
     */
    static paginated<T>(
        res: IResponse,
        data: T[],
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        },
        message: string = 'Data retrieved successfully'
    ): void {
        if (res.headersSent) return;
        
        const paginationData = {
            ...pagination,
            hasNext: pagination.page < pagination.totalPages,
            hasPrev: pagination.page > 1,
        };

        this.success(res, data, message, 200, paginationData);
    }
}