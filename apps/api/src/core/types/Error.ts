// Error types
export interface AppError extends Error {
    statusCode: number;
    isOperational: boolean;
}

// Validation types
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
} 