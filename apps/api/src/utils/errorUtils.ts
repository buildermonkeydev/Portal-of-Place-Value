import {
    AppError,
    ValidationError,
    AuthError as AuthenticationError,
    ForbiddenError as AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    DatabaseError,
    ExternalServiceError,
    ERROR_MESSAGES,
    ERROR_CODES
} from './errors';

/**
 * Error Utility Functions for easy error creation and handling
 */

// Validation Errors
export const throwValidationError = (message: string, details?: any): never => {
    throw new ValidationError(message, details);
};

export const throwInvalidInputError = (field: string, value: any, reason?: string): never => {
    const message = `Invalid ${field}: ${value}${reason ? ` - ${reason}` : ''}`;
    throw new AppError(message, 400, ERROR_CODES.INVALID_INPUT, true, { field, value, reason });
};

export const throwMissingFieldError = (field: string): never => {
    const message = `Missing required field: ${field}`;
    throw new AppError(message, 400, ERROR_CODES.MISSING_REQUIRED_FIELD, true, { field });
};

// Authentication Errors
export const throwAuthenticationError = (message: string = 'Authentication failed', details?: any): never => {
    throw new AuthenticationError(message, details);
};

export const throwInvalidCredentialsError = (): never => {
    throw new AppError('Invalid email or password', 401, ERROR_CODES.INVALID_CREDENTIALS, true);
};

export const throwTokenExpiredError = (): never => {
    throw new AppError('Authentication token has expired', 401, ERROR_CODES.TOKEN_EXPIRED, true);
};

export const throwInvalidTokenError = (reason?: string): never => {
    const message = 'Invalid authentication token';
    throw new AppError(message, 401, ERROR_CODES.INVALID_TOKEN, true, { reason });
};

export const throwMissingTokenError = (): never => {
    throw new AppError('Authentication token is required', 401, ERROR_CODES.MISSING_TOKEN, true);
};

// Authorization Errors
export const throwAuthorizationError = (message: string = 'Access denied', details?: any): never => {
    throw new AuthorizationError(message, details);
};

export const throwInsufficientPermissionsError = (requiredRole: string, userRole: string): never => {
    const message = `Insufficient permissions. Required: ${requiredRole}, Current: ${userRole}`;
    throw new AppError(message, 403, ERROR_CODES.INSUFFICIENT_PERMISSIONS, true, { requiredRole, userRole });
};

export const throwRoleRequiredError = (requiredRole: string): never => {
    const message = `Role required: ${requiredRole}`;
    throw new AppError(message, 403, ERROR_CODES.ROLE_REQUIRED, true, { requiredRole });
};

// Not Found Errors
export const throwNotFoundError = (resource: string, identifier?: any): never => {
    const message = `${resource} not found${identifier ? ` with identifier: ${identifier}` : ''}`;
    throw new NotFoundError(message, resource);
};

export const throwUserNotFoundError = (identifier: string | number): never => {
    throw new AppError(`User not found with identifier: ${identifier}`, 404, ERROR_CODES.USER_NOT_FOUND, true, { identifier });
};

export const throwResourceNotFoundError = (resource: string, identifier: string | number): never => {
    throw new AppError(`${resource} not found with identifier: ${identifier}`, 404, ERROR_CODES.RESOURCE_NOT_FOUND, true, { resource, identifier });
};

// Conflict Errors
export const throwConflictError = (message: string, details?: any): never => {
    throw new ConflictError(message, details);
};

export const throwDuplicateEmailError = (email: string): never => {
    throw new AppError(`Email already exists: ${email}`, 409, ERROR_CODES.DUPLICATE_EMAIL, true, { email });
};

export const throwDuplicateUsernameError = (username: string): never => {
    throw new AppError(`Username already exists: ${username}`, 409, ERROR_CODES.DUPLICATE_USERNAME, true, { username });
};

export const throwResourceExistsError = (resource: string, identifier: string | number): never => {
    throw new AppError(`${resource} already exists with identifier: ${identifier}`, 409, ERROR_CODES.RESOURCE_EXISTS, true, { resource, identifier });
};

// Rate Limit Errors
export const throwRateLimitError = (message: string = 'Too many requests', details?: any): never => {
    throw new RateLimitError(message, details);
};

export const throwTooManyRequestsError = (limit: number, window: string): never => {
    const message = `Rate limit exceeded: ${limit} requests per ${window}`;
    throw new AppError(message, 429, ERROR_CODES.TOO_MANY_REQUESTS, true, { limit, window });
};

// Database Errors
export const throwDatabaseError = (message: string, details?: any): never => {
    throw new DatabaseError(message, details);
};

export const throwDatabaseConnectionError = (): never => {
    throw new AppError('Database connection failed', 500, ERROR_CODES.DATABASE_ERROR, false, { type: 'connection' });
};

export const throwDatabaseQueryError = (operation: string, details?: any): never => {
    const message = `Database ${operation} operation failed`;
    throw new AppError(message, 500, ERROR_CODES.DATABASE_ERROR, false, { operation, details });
};

// External Service Errors
export const throwExternalServiceError = (service: string, message: string, details?: any): never => {
    const fullMessage = `${service} service error: ${message}`;
    throw new ExternalServiceError(fullMessage, service, undefined, 502);
};

// Generic Error Helpers
export const throwOperationalError = (message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR', details?: any): never => {
    throw new AppError(message, statusCode, errorCode, true, details);
};

export const throwProgrammingError = (message: string, details?: any): never => {
    throw new AppError(message, 500, ERROR_CODES.INTERNAL_ERROR, false, details);
};

// Error Checking Utilities
export const isOperationalError = (error: Error): boolean => {
    return error instanceof AppError && error.isOperational;
};

export const isClientError = (error: Error): boolean => {
    if (error instanceof AppError) {
        return error.statusCode >= 400 && error.statusCode < 500;
    }
    return false;
};

export const isServerError = (error: Error): boolean => {
    if (error instanceof AppError) {
        return error.statusCode >= 500;
    }
    return false;
};

// Error Response Builder
export const buildErrorResponse = (error: AppError | Error) => {
    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                code: error.errorCode,
                message: error.message,
                details: error.details,
                statusCode: error.statusCode,
            },
            timestamp: new Date().toISOString(),
        };
    }

    return {
        success: false,
        error: {
            code: ERROR_CODES.UNKNOWN_ERROR,
            message: error.message || 'Unknown error occurred',
            statusCode: 500,
        },
        timestamp: new Date().toISOString(),
    };
};

// Async Error Wrapper
export const withErrorHandling = <T extends any[], R>(
    fn: (...args: T) => Promise<R> | R
) => {
    return async (...args: T): Promise<R> => {
        try {
            return await fn(...args);
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            if (error instanceof Error) {
                throw new AppError(
                    error.message,
                    500,
                    ERROR_CODES.UNKNOWN_ERROR,
                    false,
                    { originalError: error.name, stack: error.stack }
                );
            }

            // Handle unknown error types
            throw new AppError(
                'An unexpected error occurred',
                500,
                ERROR_CODES.UNKNOWN_ERROR,
                false,
                { originalError: String(error) }
            );
        }
    };
}; 