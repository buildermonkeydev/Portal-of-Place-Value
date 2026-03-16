export interface DatabaseConfig {
    host: string;
    url: string;
    name: string;
    username?: string;
    password?: string;
    ssl?: boolean;
    maxConnections?: number;
    connectionTimeout?: number;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    url?: string;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
    lazyConnect?: boolean;
    keepAlive?: number;
    connectTimeout?: number;
    commandTimeout?: number;
    // Cache configuration
    ttl?: number;
    prefix?: string;
    // Session configuration
    sessionTtl?: number;
    maxSessionsPerUser?: number;
    sessionPrefix?: string;
}

export interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
}

export interface JWTConfig {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    issuer?: string;
    audience?: string;
}


export interface URLCONFIG {
    assessmentsUrl: string;
    loginUrl: string;
    registerUrl: string;
    dashboardUrl: string;
    leaderboardUrl: string;
    resultUrl: string;
}


export interface AppConfig {
    name: string;
    version: string;
    url: string;
    domain: string;
    helpUrl: string;
    environment: 'development' | 'staging' | 'production';
    port: number;
    host: string;
    cors: {
        origin: string[];
        credentials: boolean;
    };
}

export interface LoggingConfig {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'simple' | 'combined';
    enableConsole: boolean;
    enableFile: boolean;
    filePath?: string;
    maxFiles?: number;
    maxSize?: string;
}

export interface CacheConfig {
    ttl: number;
    prefix: string;
    maxKeys?: number;
}

export interface SessionConfig {
    ttl: number;
    maxSessionsPerUser: number;
    prefix: string;
}

export interface QueueConfig {
    prefix: string;
    defaultPriority: number;
    maxRetries: number;
    concurrency: {
        mail: number;
        notifications: number;
        dataProcessing: number;
    };
}

export interface WorkerConfig {
    mailConcurrency: number;
    notificationConcurrency: number;
    dataProcessingConcurrency: number;
}

export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
}

export interface SecurityConfig {
    bcryptRounds: number;
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSymbols: boolean;
    sessionSecret: string;
    cookieSecret: string;
}

export interface MonitoringConfig {
    enableMetrics: boolean;
    enableHealthCheck: boolean;
    healthCheckPath: string;
    metricsPath: string;
    enablePrometheus: boolean;
    prometheusPort?: number;
}

export interface ExternalServicesConfig {
    aws?: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        s3Bucket?: string;
    };
    stripe?: {
        publicKey: string;
        secretKey: string;
        webhookSecret: string;
    };
    sendgrid?: {
        apiKey: string;
        fromEmail: string;
    };
    twilio?: {
        accountSid: string;
        authToken: string;
        fromNumber: string;
    };
}

export interface EnvironmentConfig {
    // Core
    app: AppConfig;
    database: DatabaseConfig;
    redis: RedisConfig;

    // Authentication & Security
    jwt: JWTConfig;
    security: SecurityConfig;

    // Communication
    smtp: SMTPConfig;
    externalServices: ExternalServicesConfig;

    urlConfig: URLCONFIG
    // Features
    cache: CacheConfig;
    session: SessionConfig;
    queue: QueueConfig;
    judge0Url: JUDGE0_API_URL;

    worker: WorkerConfig;
    rateLimit: RateLimitConfig;

    // Monitoring & Logging
    logging: LoggingConfig;
    monitoring: MonitoringConfig;
}

export type Environment = 'development' | 'staging' | 'production';

export interface ConfigOptions {
    environment?: Environment;
    configPath?: string;
    validateOnLoad?: boolean;
    strictMode?: boolean;
}



export interface JUDGE0_API_URL {
    first: string;
    second?: string;
    third?: string;
    fourth?: string;
    fifth?: string;
}