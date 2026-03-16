import { Response } from 'express';
import logger from '@repo/logger';
import { getConfig } from '@repo/env-config';

// Base Error Class
export abstract class BaseError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly timestamp: string;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }
}

// App Error Class (extends BaseError for compatibility)
export class AppError extends BaseError {
    public readonly errorCode: string;
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: number = 500,
        errorCode: string = 'INTERNAL_ERROR',
        isOperational: boolean = true,
        details?: any
    ) {
        super(message, statusCode, isOperational);
        this.name = 'AppError';
        this.errorCode = errorCode;
        this.details = details;
    }
}

// Authentication & Authorization Errors
export class AuthError extends BaseError {
    constructor(message: string, statusCode: number = 400) {
        super(message, statusCode, true);
        this.name = 'AuthError';
    }
}

export class UnauthorizedError extends BaseError {
    constructor(message: string, statusCode: number = 401) {
        super(message, statusCode, true);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends BaseError {
    constructor(message: string, statusCode: number = 403) {
        super(message, statusCode, true);
        this.name = 'ForbiddenError';
    }
}

// Validation Errors
export class ValidationError extends BaseError {
    public readonly field?: string;
    public readonly value?: any;
    public readonly details?: any;

    constructor(message: string, details?: any, statusCode: number = 400) {
        super(message, statusCode, true);
        this.name = 'ValidationError';
        this.details = details;
    }
}

// Not Found Errors
export class NotFoundError extends BaseError {
    public readonly resource: string;

    constructor(message: string, resource: string = 'Resource', statusCode: number = 404) {
        super(message, statusCode, true);
        this.name = 'NotFoundError';
        this.resource = resource;
    }
}

// Conflict Errors
export class ConflictError extends BaseError {
    public readonly conflictingField: string;

    constructor(message: string, conflictingField: string, statusCode: number = 409) {
        super(message, statusCode, true);
        this.name = 'ConflictError';
        this.conflictingField = conflictingField;
    }
}

// Rate Limiting Errors
export class RateLimitError extends BaseError {
    public readonly retryAfter: number;

    constructor(message: string, retryAfter: number = 60, statusCode: number = 429) {
        super(message, statusCode, true);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

// Database Errors
export class DatabaseError extends BaseError {
    public readonly operation: string;
    public readonly table?: string;

    constructor(message: string, operation: string, table?: string, statusCode: number = 500) {
        super(message, statusCode, false); // Database errors are usually programmer errors
        this.name = 'DatabaseError';
        this.operation = operation;
        this.table = table;
    }
}

// External Service Errors
export class ExternalServiceError extends BaseError {
    public readonly service: string;
    public readonly endpoint?: string;

    constructor(message: string, service: string, endpoint?: string, statusCode: number = 502) {
        super(message, statusCode, true);
        this.name = 'ExternalServiceError';
        this.service = service;
        this.endpoint = endpoint;
    }
}

// File Upload Errors
export class FileUploadError extends BaseError {
    public readonly fileName?: string;
    public readonly fileSize?: number;

    constructor(message: string, fileName?: string, fileSize?: number, statusCode: number = 413) {
        super(message, statusCode, true);
        this.name = 'FileUploadError';
        this.fileName = fileName;
        this.fileSize = fileSize;
    }
}

// Business Logic Errors
export class BusinessLogicError extends BaseError {
    public readonly operation: string;

    constructor(message: string, operation: string, statusCode: number = 422) {
        super(message, statusCode, true);
        this.name = 'BusinessLogicError';
        this.operation = operation;
    }
}

// Error Response Interface
export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        statusCode: number;
        name: string;
        field?: string;
        resource?: string;
        conflictingField?: string;
        retryAfter?: number;
        operation?: string;
        table?: string;
        service?: string;
        endpoint?: string;
        fileName?: string;
        fileSize?: number;
        timestamp: string;
        stack?: string;
    };
    timestamp: string;
    path: string;
    requestId?: string;
}

// Success Response Interface
export interface SuccessResponse<T = any> {
    success: true;
    message: string;
    data: T;
    timestamp: string;
    requestId?: string;
}

export class ErrorHandler {
    private static isTrustedError(error: Error): boolean {
        return error instanceof BaseError && error.isOperational;
    }

    private static logError(error: Error, req?: any): void {
        const errorInfo = {
            name: error.name,
            message: error.message,
            statusCode: (error as BaseError).statusCode || 500,
            stack: error.stack,
            isOperational: (error as BaseError).isOperational,
            timestamp: (error as BaseError).timestamp || new Date().toISOString(),
            ...(req && {
                url: req.url,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                body: req.body,
                params: req.params,
                query: req.query
            })
        };

        if (this.isTrustedError(error)) {
            logger.error(`Operational Error: ${error.message}`, 'ErrorHandler', errorInfo);
        } else {
            logger.error(`Programmer Error: ${error.message}`, 'ErrorHandler', errorInfo);
        }
    }

    private static formatError(error: Error, req?: any): ErrorResponse {
        const baseError = error as BaseError;
        const requestId = req?.requestId || req?.id;

        const errorResponse: ErrorResponse = {
            success: false,
            error: {
                message: baseError.message || 'Internal Server Error',
                statusCode: baseError.statusCode || 500,
                name: error.name || 'Error',
                timestamp: baseError.timestamp || new Date().toISOString(),
                ...(getConfig().isDevelopment() && { stack: error.stack })
            },
            timestamp: new Date().toISOString(),
            path: req?.url || 'unknown',
            ...(requestId && { requestId })
        };

        // Add specific error properties
        if (error instanceof ValidationError) {
            errorResponse.error.field = error.field;
        }
        if (error instanceof NotFoundError) {
            errorResponse.error.resource = error.resource;
        }
        if (error instanceof ConflictError) {
            errorResponse.error.conflictingField = error.conflictingField;
        }
        if (error instanceof RateLimitError) {
            errorResponse.error.retryAfter = error.retryAfter;
        }
        if (error instanceof DatabaseError) {
            errorResponse.error.operation = error.operation;
            errorResponse.error.table = error.table;
        }
        if (error instanceof ExternalServiceError) {
            errorResponse.error.service = error.service;
            errorResponse.error.endpoint = error.endpoint;
        }
        if (error instanceof FileUploadError) {
            errorResponse.error.fileName = error.fileName;
            errorResponse.error.fileSize = error.fileSize;
        }
        if (error instanceof BusinessLogicError) {
            errorResponse.error.operation = error.operation;
        }

        return errorResponse;
    }

    public static handleError(error: Error, req?: any, res?: Response): void {
        this.logError(error, req);

        if (res) {
            const errorResponse = this.formatError(error, req);
            const statusCode = errorResponse.error.statusCode;

            res.status(statusCode).json(errorResponse);
        }
    }

    public static handleAsyncError(fn: Function) {
        return (req: any, res: Response, next: any) => {
            Promise.resolve(fn(req, res, next)).catch((error) => {
                ErrorHandler.handleError(error, req, res);
            });
        };
    }
}

// Response Helper Functions
export const sendErrorResponse = (res: Response, error: Error, req?: any): void => {
    ErrorHandler.handleError(error, req, res);
};

export const sendSuccessResponse = <T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    requestId?: string
): void => {
    const response: SuccessResponse<T> = {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId })
    };

    res.status(statusCode).json(response);
};

// Async Handler Wrapper
export const asyncHandler = ErrorHandler.handleAsyncError;

// Common Error Messages
export const ERROR_MESSAGES = {
    // Authentication
    INVALID_CREDENTIALS: 'Invalid email or password. Please check your credentials and try again.',
    SESSION_EXPIRED: 'Session is invalid or expired. Please login again.',
    NO_SESSION: 'No session found. Please login first.',
    ACCESS_DENIED: 'Access denied. Insufficient permissions.',
    ADMIN_REQUIRED: 'Access denied. Admin privileges required.',
    UNAUTHORIZED: 'Unauthorized access. Please login to continue.',

    // Validation
    REQUIRED_FIELD: (field: string) => `${field} is required.`,
    INVALID_EMAIL: 'Please provide a valid email address.',
    INVALID_PASSWORD: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
    PASSWORD_MISMATCH: 'Passwords do not match.',
    INVALID_YEAR: 'Year must be between 1 and 4.',
    INVALID_REGISTRATION_NO: 'Invalid registration number format.',

    // Not Found
    USER_NOT_FOUND: 'User not found.',
    SESSION_NOT_FOUND: 'Session not found or already expired.',
    ASSESSMENT_NOT_FOUND: 'Assessment not found.',
    RESOURCE_NOT_FOUND: (resource: string) => `${resource} not found.`,

    // Conflict
    EMAIL_EXISTS: 'A user with this email already exists.',
    REGISTRATION_EXISTS: 'A user with this registration number already exists.',
    USER_EXISTS: 'A user with this email or registration number already exists.',
    ASSESSMENT_ALREADY_EXISTS: 'An assessment with this title already exists.',

    // Business Logic
    PASSWORD_SAME: 'New password must be different from current password.',
    EMAIL_NOT_VERIFIED: 'Please verify your email address before proceeding.',
    ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
    SESSION_LIMIT_REACHED: 'Maximum number of active sessions reached. Please logout from another device.',

    // External Services
    EMAIL_SERVICE_DOWN: 'Email service is currently unavailable. Please try again later.',
    DATABASE_CONNECTION_ERROR: 'Database connection error. Please try again later.',

    // File Upload
    FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
    INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported file format.',
    FILE_UPLOAD_FAILED: 'File upload failed. Please try again.',

    // Rate Limiting
    TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
    LOGIN_ATTEMPTS_EXCEEDED: 'Too many failed login attempts. Please try again later.',

    // Generic
    INTERNAL_SERVER_ERROR: 'Internal server error. Please try again later.',
    SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
    NOT_IMPLEMENTED: 'This feature is not yet implemented.',
} as const;

// Error Codes
export const ERROR_CODES = {
    // Validation
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

    // Authentication
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    MISSING_TOKEN: 'MISSING_TOKEN',

    // Authorization
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    ROLE_REQUIRED: 'ROLE_REQUIRED',

    // Not Found
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

    // Conflict
    DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
    DUPLICATE_USERNAME: 'DUPLICATE_USERNAME',
    RESOURCE_EXISTS: 'RESOURCE_EXISTS',

    // Rate Limiting
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

    // Database
    DATABASE_ERROR: 'DATABASE_ERROR',

    // External Services
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

    // Generic
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    RESULTS_NOT_AVAILABLE: 'RESULTS_NOT_AVAILABLE',
} as const;

// Error Factory Functions
export const createValidationError = (message: string, field: string, value?: any): ValidationError => {
    return new ValidationError(message, field, value);
};

export const createAuthError = (message: string): AuthError => {
    return new AuthError(message);
};

export const createUnauthorizedError = (message: string = ERROR_MESSAGES.UNAUTHORIZED): UnauthorizedError => {
    return new UnauthorizedError(message);
};

export const createForbiddenError = (message: string = ERROR_MESSAGES.ACCESS_DENIED): ForbiddenError => {
    return new ForbiddenError(message);
};

export const createNotFoundError = (message: string, resource: string = 'Resource'): NotFoundError => {
    return new NotFoundError(message, resource);
};

export const createConflictError = (message: string, field: string): ConflictError => {
    return new ConflictError(message, field);
};

export const createDatabaseError = (message: string, operation: string, table?: string): DatabaseError => {
    return new DatabaseError(message, operation, table);
};

export const createBusinessLogicError = (message: string, operation: string): BusinessLogicError => {
    return new BusinessLogicError(message, operation);
};

// All classes and utilities are already exported above
