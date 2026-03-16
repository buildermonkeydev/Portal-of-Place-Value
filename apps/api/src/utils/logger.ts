import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import Config from '@repo/env-config';

const config = Config.getInstance();
const logDir = config.getLogging().filePath || 'logs';
const logLevel = config.getLogging().level;

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, error, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        // Add error details if present
        if (error && typeof error === 'object') {
            const errorObj = error as any;
            log += `\nError Details:`;
            log += `\n  Name: ${errorObj.name || 'Unknown'}`;
            log += `\n  Message: ${errorObj.message || 'No message'}`;
            log += `\n  Code: ${errorObj.code || 'No code'}`;
            log += `\n  Status: ${errorObj.status || errorObj.statusCode || 'No status'}`;
            if (errorObj.cause) {
                log += `\n  Cause: ${JSON.stringify(errorObj.cause)}`;
            }
        }

        // Add metadata
        if (Object.keys(meta).length > 0) {
            log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
        }

        // Add stack trace
        if (stack) {
            log += `\nStack Trace:\n${stack}`;
        }

        return log;
    })
);

// Create daily rotate file transport for all logs
const dailyRotateFileTransport = new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: logLevel,
});

// Create daily rotate file transport for error logs
const errorFileTransport = new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
});

// Create console transport for development
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, stack, error, ...meta }) => {
            let log = `${timestamp} [${level}]: ${message}`;

            // Add error details if present
            if (error && typeof error === 'object') {
                const errorObj = error as any;
                log += `\n🔴 Error Details:`;
                log += `\n  Name: ${errorObj.name || 'Unknown'}`;
                log += `\n  Message: ${errorObj.message || 'No message'}`;
                log += `\n  Code: ${errorObj.code || 'No code'}`;
                log += `\n  Status: ${errorObj.status || errorObj.statusCode || 'No status'}`;
                if (errorObj.cause) {
                    log += `\n  Cause: ${JSON.stringify(errorObj.cause)}`;
                }
            }

            // Add metadata
            if (Object.keys(meta).length > 0) {
                log += `\n📊 Metadata: ${JSON.stringify(meta, null, 2)}`;
            }

            // Add stack trace
            if (stack) {
                log += `\n📚 Stack Trace:\n${stack}`;
            }

            return log;
        })
    ),
});

// Create logger instance
export const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'express-typescript-api' },
    transports: [
        dailyRotateFileTransport,
        errorFileTransport,
    ],
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join(logDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join(logDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
});

// if (config.getApp().environment !== 'production') {
logger.add(consoleTransport);
// }

export const logStream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};

// Export logger methods for convenience
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logError = (message: string, error?: Error, meta?: any) => {
    const errorMeta = {
        ...meta,
        error: error ? {
            name: error.name,
            message: error.message,
            code: (error as any).code,
            status: (error as any).status || (error as any).statusCode,
            cause: (error as any).cause,
            stack: error.stack
        } : undefined
    };
    logger.error(message, errorMeta);
};
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);

// Enhanced error logging with full context
export const logErrorWithContext = (
    message: string,
    error: Error,
    context: {
        userId?: string;
        requestId?: string;
        endpoint?: string;
        method?: string;
        ip?: string;
        userAgent?: string;
        body?: any;
        query?: any;
        params?: any;
        [key: string]: any;
    } = {}
) => {
    const errorMeta = {
        ...context,
        error: {
            name: error.name,
            message: error.message,
            code: (error as any).code,
            status: (error as any).status || (error as any).statusCode,
            cause: (error as any).cause,
            stack: error.stack
        },
        timestamp: new Date().toISOString(),
        environment: config.getApp().environment,
        service: 'express-typescript-api'
    };
    logger.error(message, errorMeta);
}; 
