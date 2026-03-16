import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import * as Joi from "joi";
import {
    EnvironmentConfig,
    Environment,
    ConfigOptions,
    DatabaseConfig,
    RedisConfig,
    SMTPConfig,
    JWTConfig,
    AppConfig,
    LoggingConfig,
    CacheConfig,
    SessionConfig,
    QueueConfig,
    WorkerConfig,
    RateLimitConfig,
    SecurityConfig,
    MonitoringConfig,
    ExternalServicesConfig,
    URLCONFIG,
    JUDGE0_API_URL,
} from './types';
import {
    environmentConfigSchema,
    databaseConfigSchema,
    redisConfigSchema,
    smtpConfigSchema,
    jwtConfigSchema,
    appConfigSchema,
    loggingConfigSchema,
    cacheConfigSchema,
    sessionConfigSchema,
    queueConfigSchema,
    workerConfigSchema,
    rateLimitConfigSchema,
    securityConfigSchema,
    monitoringConfigSchema,
    externalServicesConfigSchema,
    urlConfigSchema,
} from './validation';

export class Config {
    private static instance: Config;
    private config: EnvironmentConfig;
    private environment: Environment;
    private isInitialized: boolean = false;

    private constructor(options: ConfigOptions = {}) {
        this.environment = options.environment || this.detectEnvironment();
        this.loadEnvironment(options.configPath);
        this.config = this.buildConfig();

        if (options.validateOnLoad !== false) {
            this.validateConfig();
        }
    }

    /**
     * Get singleton instance
     */
    public static getInstance(options?: ConfigOptions): Config {
        if (!Config.instance) {
            Config.instance = new Config(options);
        }
        return Config.instance;
    }

    /**
     * Initialize configuration (alternative to getInstance)
     */
    public static initialize(options?: ConfigOptions): Config {
        Config.instance = new Config(options);
        return Config.instance;
    }

    /**
     * Get full configuration
     */
    public getConfig(): EnvironmentConfig {
        if (!this.isInitialized) {
            throw new Error('Config not initialized. Call initialize() first.');
        }
        return this.config;
    }

    /**
     * Get app configuration
     */
    public getApp(): AppConfig {
        return this.config.app;
    }

    /**
     * Get database configuration
     */
    public getDatabase(): DatabaseConfig {
        return this.config.database;
    }

    public getUrlsConfig(): URLCONFIG {
        return this.config.urlConfig;
    }

    /**
     * Get Redis configuration
     */
    public getRedis(): RedisConfig {
        return this.config.redis;
    }

    /**
     * Get SMTP configuration
     */
    public getSMTP(): SMTPConfig {
        return this.config.smtp;
    }

    /**
     * Get JWT configuration
     */
    public getJWT(): JWTConfig {
        return this.config.jwt;
    }

    /**
     * Get security configuration
     */
    public getSecurity(): SecurityConfig {
        return this.config.security;
    }

    /**
     * Get cache configuration
     */
    public getCache(): CacheConfig {
        return this.config.cache;
    }

    /**
     * Get session configuration
     */
    public getSession(): SessionConfig {
        return this.config.session;
    }

    /**
     * Get queue configuration
     */
    public getQueue(): QueueConfig {
        return this.config.queue;
    }

    public getJudge0Url(): JUDGE0_API_URL {
        return this.config.judge0Url;
    }

    /**
     * Get worker configuration
     */
    public getWorker(): WorkerConfig {
        return this.config.worker;
    }

    /**
     * Get rate limit configuration
     */
    public getRateLimit(): RateLimitConfig {
        return this.config.rateLimit;
    }

    /**
     * Get logging configuration
     */
    public getLogging(): LoggingConfig {
        return this.config.logging;
    }

    /**
     * Get monitoring configuration
     */
    public getMonitoring(): MonitoringConfig {
        return this.config.monitoring;
    }

    /**
     * Get external services configuration
     */
    public getExternalServices(): ExternalServicesConfig {
        return this.config.externalServices;
    }

    /**
     * Get current environment
     */
    public getEnvironment(): Environment {
        return this.environment;
    }

    /**
     * Check if running in development
     */
    public isDevelopment(): boolean {
        return this.environment === 'development';
    }

    /**
     * Check if running in production
     */
    public isProduction(): boolean {
        return this.environment === 'production';
    }

    /**
     * Check if running in staging
     */
    public isStaging(): boolean {
        return this.environment === 'staging';
    }

    /**
     * Get environment variable with fallback
     */
    public getEnv(key: string, defaultValue?: string): string {
        // console.log("ENV", process.env.REDIS_URL)
        return process.env[key] || defaultValue || '';
    }

    /**
     * Get required environment variable
     */
    public getRequiredEnv(key: string): string {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Required environment variable ${key} is not set`);
        }
        return value;
    }

    /**
     * Get boolean environment variable
     */
    public getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
        const value = process.env[key];
        if (!value) return defaultValue;
        return value.toLowerCase() === 'true' || value === '1';
    }

    /**
     * Get number environment variable
     */
    public getNumberEnv(key: string, defaultValue: number): number {
        const value = process.env[key];
        if (!value) return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    /**
     * Get array environment variable (comma-separated)
     */
    public getArrayEnv(key: string, defaultValue: string[] = []): string[] {
        const value = process.env[key];
        if (!value) return defaultValue;
        return value.split(',').map(item => item.trim()).filter(Boolean);
    }

    /**
     * Detect environment from NODE_ENV
     */
    private detectEnvironment(): Environment {
        const env = process.env.NODE_ENV;
        if (env === 'production' || env === 'staging') {
            return env;
        }
        return 'development';
    }

    /**
     * Load environment variables
     */
    private loadEnvironment(configPath?: string): void {
        // Get the root directory of the compiler project
        const rootDir = resolve(__dirname, '../../../');

        console.log("ROOT_DIR", rootDir);
        const paths = [
            configPath,
            resolve(rootDir, '.env.local'),
            resolve(rootDir, `.env.${this.environment}`),
            resolve(rootDir, '.env'),
        ].filter(Boolean) as string[];
        // console.log("paths", paths);

        for (const path of paths) {
            if (existsSync(path)) {
                console.log(` Attempting to load .env from: ${path}`);
                const result = config({ path, override: true });
                console.log(` Loaded environment from: ${path}`);
                if (result.error) {
                    console.error(` Error loading .env file: ${result.error}`);
                } else {
                    console.log(` Environment variables loaded successfully`);
                    // Debug: Check if APP_URL is loaded
                    console.log(`APP_URL: ${process.env.APP_URL}`);
                    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
                    console.log(`DB_URL: ${process.env.DB_URL}`);
                    console.log(`Result parsed:`, result.parsed);
                }
                break;
            } else {
                console.log(`File not found: ${path}`);
            }
        }
    }

    /**
     * Build configuration from environment variables
     */
    private buildConfig(): EnvironmentConfig {
        return {
            app: this.buildAppConfig(),
            database: this.buildDatabaseConfig(),
            redis: this.buildRedisConfig(),
            jwt: this.buildJWTConfig(),
            security: this.buildSecurityConfig(),
            smtp: this.buildSMTPConfig(),
            externalServices: this.buildExternalServicesConfig(),
            urlConfig: this.buildURLConfig(),
            cache: this.buildCacheConfig(),
            judge0Url: this.buildJudge0Url(),
            session: this.buildSessionConfig(),
            queue: this.buildQueueConfig(),
            worker: this.buildWorkerConfig(),
            rateLimit: this.buildRateLimitConfig(),
            logging: this.buildLoggingConfig(),
            monitoring: this.buildMonitoringConfig(),
        };
    }

    /**
     * Build app configuration
     */
    private buildAppConfig(): AppConfig {
        return {
            name: this.getEnv('APP_NAME', 'Bl-compiler'),
            version: this.getEnv('APP_VERSION', '1.0.0'),
            url: this.getRequiredEnv('APP_URL'),
            domain: this.getRequiredEnv('APP_DOMAIN'),
            helpUrl: this.getRequiredEnv('HELP_URL'),
            environment: this.environment,
            port: this.getNumberEnv('PORT', 3000),
            host: this.getEnv('HOST', 'localhost'),
            cors: {
                origin: this.getArrayEnv('CORS_ORIGIN', ['http://localhost:3000', "https://www.assessments.blcompiler.com", 'www.assessments.blcompiler.com', 'https://assessments.blcompiler.com,assessments.blcompiler.com']),
                credentials: this.getBooleanEnv('CORS_CREDENTIALS', true),
            },
        };
    }

    /**
     * Build database configuration
     */
    private buildDatabaseConfig(): DatabaseConfig {
        return {
            host: this.getRequiredEnv('DB_HOST'),
            url: this.getRequiredEnv('DB_URL'),
            name: this.getRequiredEnv('DB_NAME'),
            username: this.getEnv('DB_USERNAME'),
            password: this.getEnv('DB_PASSWORD'),
            ssl: this.getBooleanEnv('DB_SSL', false),
            maxConnections: this.getNumberEnv('DB_MAX_CONNECTIONS', 10),
            connectionTimeout: this.getNumberEnv('DB_CONNECTION_TIMEOUT', 30000),
        };
    }

    /**
     * Build Redis configuration
     */
    private buildRedisConfig(): RedisConfig {
        return {
            host: this.getEnv('REDIS_HOST', ''),
            port: this.getNumberEnv('REDIS_PORT', 6379),
            password: this.getEnv('REDIS_PASSWORD'),
            db: this.getNumberEnv('REDIS_DB', 0),
            url: this.getEnv('REDIS_URL'),
            retryDelayOnFailover: this.getNumberEnv('REDIS_RETRY_DELAY', 100),
            maxRetriesPerRequest: this.getNumberEnv('REDIS_MAX_RETRIES', 3),
            lazyConnect: this.getBooleanEnv('REDIS_LAZY_CONNECT', true),
            keepAlive: this.getNumberEnv('REDIS_KEEP_ALIVE', 30000),
            connectTimeout: this.getNumberEnv('REDIS_CONNECT_TIMEOUT', 10000),
            commandTimeout: this.getNumberEnv('REDIS_COMMAND_TIMEOUT', 5000),
            ttl: this.getNumberEnv('REDIS_CACHE_TTL', 3600),
            prefix: this.getEnv('REDIS_CACHE_PREFIX', 'cache:'),
            sessionTtl: this.getNumberEnv('REDIS_SESSION_TTL', 86400),
            maxSessionsPerUser: this.getNumberEnv('REDIS_SESSION_MAX_PER_USER', 5),
            sessionPrefix: this.getEnv('REDIS_SESSION_PREFIX', 'session:'),
        };
    }

    /**
     * Build SMTP configuration
     */
    private buildSMTPConfig(): SMTPConfig {
        return {
            host: this.getRequiredEnv('SMTP_HOST'),
            port: this.getNumberEnv('SMTP_PORT', 587),
            secure: this.getBooleanEnv('SMTP_SECURE', false),
            user: this.getRequiredEnv('SMTP_USER'),
            pass: this.getRequiredEnv('SMTP_PASS'),
            from: this.getRequiredEnv('SMTP_FROM'),
        };
    }

    /**
     * Build JWT configuration
     */
    private buildJWTConfig(): JWTConfig {
        return {
            secret: this.getRequiredEnv('JWT_SECRET'),
            expiresIn: this.getEnv('JWT_EXPIRES_IN', '1h'),
            refreshSecret: this.getRequiredEnv('JWT_REFRESH_SECRET'),
            refreshExpiresIn: this.getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
            issuer: this.getEnv('JWT_ISSUER'),
            audience: this.getEnv('JWT_AUDIENCE'),
        };
    }

    /**
     * Build security configuration
     */
    private buildSecurityConfig(): SecurityConfig {
        return {
            bcryptRounds: this.getNumberEnv('BCRYPT_ROUNDS', 12),
            passwordMinLength: this.getNumberEnv('PASSWORD_MIN_LENGTH', 8),
            passwordRequireUppercase: this.getBooleanEnv('PASSWORD_REQUIRE_UPPERCASE', true),
            passwordRequireLowercase: this.getBooleanEnv('PASSWORD_REQUIRE_LOWERCASE', true),
            passwordRequireNumbers: this.getBooleanEnv('PASSWORD_REQUIRE_NUMBERS', true),
            passwordRequireSymbols: this.getBooleanEnv('PASSWORD_REQUIRE_SYMBOLS', false),
            sessionSecret: this.getRequiredEnv('SESSION_SECRET'),
            cookieSecret: this.getRequiredEnv('COOKIE_SECRET'),
        };
    }

    /**
     * Build external services configuration
     */
    private buildExternalServicesConfig(): ExternalServicesConfig {
        const config: ExternalServicesConfig = {};

        if (this.getEnv('AWS_REGION')) {
            config.aws = {
                region: this.getRequiredEnv('AWS_REGION'),
                accessKeyId: this.getRequiredEnv('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.getRequiredEnv('AWS_SECRET_ACCESS_KEY'),
                s3Bucket: this.getEnv('AWS_S3_BUCKET'),
            };
        }

        if (this.getEnv('STRIPE_PUBLIC_KEY')) {
            config.stripe = {
                publicKey: this.getRequiredEnv('STRIPE_PUBLIC_KEY'),
                secretKey: this.getRequiredEnv('STRIPE_SECRET_KEY'),
                webhookSecret: this.getRequiredEnv('STRIPE_WEBHOOK_SECRET'),
            };
        }

        if (this.getEnv('SENDGRID_API_KEY')) {
            config.sendgrid = {
                apiKey: this.getRequiredEnv('SENDGRID_API_KEY'),
                fromEmail: this.getRequiredEnv('SENDGRID_FROM_EMAIL'),
            };
        }

        if (this.getEnv('TWILIO_ACCOUNT_SID')) {
            config.twilio = {
                accountSid: this.getRequiredEnv('TWILIO_ACCOUNT_SID'),
                authToken: this.getRequiredEnv('TWILIO_AUTH_TOKEN'),
                fromNumber: this.getRequiredEnv('TWILIO_FROM_NUMBER'),
            };
        }

        return config;
    }

    /**
     * Build URL configuration
     */
    private buildURLConfig(): URLCONFIG {
        return {
            assessmentsUrl: this.getRequiredEnv('ASSESSMENTS_URL'),
            loginUrl: this.getRequiredEnv('LOGIN_URL'),
            registerUrl: this.getRequiredEnv('REGISTER_URL'),
            dashboardUrl: this.getRequiredEnv('DASHBOARD_URL'),
            leaderboardUrl: this.getRequiredEnv('LEADERBOARD_URL'),
            resultUrl: this.getRequiredEnv('RESULT_URL'),
        };
    }

    /**
     * Build Judge0 URL configuration
     */
    private buildJudge0Url(): JUDGE0_API_URL {
        return {
            first: this.getRequiredEnv('JUDGE0_API_URL_FIRST'),
            second: this.getEnv('JUDGE0_API_URL_SECOND'),
            third: this.getEnv('JUDGE0_API_URL_THIRD'),
            fourth: this.getEnv('JUDGE0_API_URL_FOURTH'),
            fifth: this.getEnv('JUDGE0_API_URL_FIFTH'),
        };
    }

    /**
     * Build cache configuration
     */
    private buildCacheConfig(): CacheConfig {
        return {
            ttl: this.getNumberEnv('CACHE_TTL', 3600),
            prefix: this.getEnv('CACHE_PREFIX', 'cache:'),
            maxKeys: this.getNumberEnv('CACHE_MAX_KEYS', 10000),
        };
    }

    /**
     * Build session configuration
     */
    private buildSessionConfig(): SessionConfig {
        return {
            ttl: this.getNumberEnv('SESSION_TTL', 86400),
            maxSessionsPerUser: this.getNumberEnv('SESSION_MAX_PER_USER', 5),
            prefix: this.getEnv('SESSION_PREFIX', 'session:'),
        };
    }

    /**
     * Build queue configuration
     */
    private buildQueueConfig(): QueueConfig {
        return {
            prefix: this.getEnv('QUEUE_PREFIX', 'queue:'),
            defaultPriority: this.getNumberEnv('QUEUE_DEFAULT_PRIORITY', 0),
            maxRetries: this.getNumberEnv('QUEUE_MAX_RETRIES', 3),
            concurrency: {
                mail: this.getNumberEnv('QUEUE_MAIL_CONCURRENCY', 5),
                notifications: this.getNumberEnv('QUEUE_NOTIFICATIONS_CONCURRENCY', 10),
                dataProcessing: this.getNumberEnv('QUEUE_DATA_PROCESSING_CONCURRENCY', 3),
            },
        };
    }

    /**
     * Build worker configuration
     */
    private buildWorkerConfig(): WorkerConfig {
        return {
            mailConcurrency: this.getNumberEnv('WORKER_MAIL_CONCURRENCY', 5),
            notificationConcurrency: this.getNumberEnv('WORKER_NOTIFICATION_CONCURRENCY', 10),
            dataProcessingConcurrency: this.getNumberEnv('WORKER_DATA_PROCESSING_CONCURRENCY', 3),
        };
    }

    /**
     * Build rate limit configuration
     */
    private buildRateLimitConfig(): RateLimitConfig {
        return {
            windowMs: this.getNumberEnv('RATE_LIMIT_WINDOW_MS', 900000),
            maxRequests: this.getNumberEnv('RATE_LIMIT_MAX_REQUESTS', 100),
            skipSuccessfulRequests: this.getBooleanEnv('RATE_LIMIT_SKIP_SUCCESS', false),
            skipFailedRequests: this.getBooleanEnv('RATE_LIMIT_SKIP_FAILED', false),
        };
    }

    /**
     * Build logging configuration
     */
    private buildLoggingConfig(): LoggingConfig {
        return {
            level: this.getEnv('LOG_LEVEL', 'info') as LoggingConfig['level'],
            format: this.getEnv('LOG_FORMAT', 'json') as LoggingConfig['format'],
            enableConsole: this.getBooleanEnv('LOG_ENABLE_CONSOLE', true),
            enableFile: this.getBooleanEnv('LOG_ENABLE_FILE', false),
            filePath: this.getEnv('LOG_FILE_PATH'),
            maxFiles: this.getNumberEnv('LOG_MAX_FILES', 5),
            maxSize: this.getEnv('LOG_MAX_SIZE', '10mb'),
        };
    }

    /**
     * Build monitoring configuration
     */
    private buildMonitoringConfig(): MonitoringConfig {
        return {
            enableMetrics: this.getBooleanEnv('MONITORING_ENABLE_METRICS', true),
            enableHealthCheck: this.getBooleanEnv('MONITORING_ENABLE_HEALTH_CHECK', true),
            healthCheckPath: this.getEnv('MONITORING_HEALTH_CHECK_PATH', '/health'),
            metricsPath: this.getEnv('MONITORING_METRICS_PATH', '/metrics'),
            enablePrometheus: this.getBooleanEnv('MONITORING_ENABLE_PROMETHEUS', false),
            prometheusPort: this.getNumberEnv('MONITORING_PROMETHEUS_PORT', 9090),
        };
    }

    /**
     * Validate configuration
     */
    private validateConfig(): void {
        const { error } = environmentConfigSchema.validate(this.config, {
            abortEarly: false,
            allowUnknown: false,
        });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join('\n');
            throw new Error(`Configuration validation failed:\n${errorMessages}`);
        }

        this.isInitialized = true;
    }

    /**
     * Validate specific configuration section
     */
    public validateSection<T>(section: keyof EnvironmentConfig, schema: Joi.ObjectSchema): T {
        const sectionConfig = this.config[section];
        const { error, value } = schema.validate(sectionConfig, {
            abortEarly: false,
            allowUnknown: false,
        });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join('\n');
            throw new Error(`Configuration validation failed for ${section}:\n${errorMessages}`);
        }

        return value as T;
    }
}
