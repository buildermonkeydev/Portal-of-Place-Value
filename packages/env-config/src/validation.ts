import * as Joi from 'joi';

export const databaseConfigSchema = Joi.object({
    host: Joi.string().required(),
    url: Joi.string().required(),
    name: Joi.string().required(),
    username: Joi.string().optional(),
    password: Joi.string().optional(),
    ssl: Joi.boolean().default(false),
    maxConnections: Joi.number().min(1).max(100).default(10),
    connectionTimeout: Joi.number().min(1000).default(30000),
});

export const redisConfigSchema = Joi.object({
    host: Joi.string().required(),
    port: Joi.number().port().required(),
    password: Joi.string().allow('').optional(),
    db: Joi.number().min(0).max(15).default(0),
    url: Joi.string().uri().optional(),
    retryDelayOnFailover: Joi.number().min(100).default(100),
    maxRetriesPerRequest: Joi.number().min(1).max(10).default(3),
    lazyConnect: Joi.boolean().default(true),
    keepAlive: Joi.number().min(1000).default(30000),
    connectTimeout: Joi.number().min(1000).default(10000),
    commandTimeout: Joi.number().min(1000).default(5000),
    // Cache configuration
    ttl: Joi.number().min(60).default(3600),
    prefix: Joi.string().default('cache:'),
    // Session configuration
    sessionTtl: Joi.number().min(60).default(86400),
    maxSessionsPerUser: Joi.number().min(1).default(5),
    sessionPrefix: Joi.string().default('session:'),
});

export const smtpConfigSchema = Joi.object({
    host: Joi.string().required(),
    port: Joi.number().port().required(),
    secure: Joi.boolean().default(false),
    user: Joi.string().email().required(),
    pass: Joi.string().min(1).required(),
    from: Joi.string().email().required(),
});

export const jwtConfigSchema = Joi.object({
    secret: Joi.string().min(32).required(),
    expiresIn: Joi.string().default('1h'),
    refreshSecret: Joi.string().min(32).required(),
    refreshExpiresIn: Joi.string().default('7d'),
    issuer: Joi.string().optional(),
    audience: Joi.string().optional(),
});

export const appConfigSchema = Joi.object({
    name: Joi.string().min(1).required(),
    version: Joi.string().pattern(/^\d+\.\d+\.\d+/).required(),
    url: Joi.string().uri().required(),
    domain: Joi.string().hostname().required(),
    helpUrl: Joi.string().uri().required(),
    environment: Joi.string().valid('development', 'staging', 'production').required(),
    port: Joi.number().port().required(),
    host: Joi.string().hostname().default('localhost'),
    cors: Joi.object({
        origin: Joi.array().items(Joi.string()).min(1).required(),
        credentials: Joi.boolean().default(true),
    }).required(),
});

export const loggingConfigSchema = Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    format: Joi.string().valid('json', 'simple', 'combined').default('json'),
    enableConsole: Joi.boolean().default(true),
    enableFile: Joi.boolean().default(false),
    filePath: Joi.string().when('enableFile', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
    maxFiles: Joi.number().min(1).max(30).default(5),
    maxSize: Joi.string().pattern(/^\d+[kmg]?b$/i).default('10mb'),
});

export const cacheConfigSchema = Joi.object({
    ttl: Joi.number().min(60).default(3600),
    prefix: Joi.string().default('cache:'),
    maxKeys: Joi.number().min(100).max(1000000).default(10000),
});

export const sessionConfigSchema = Joi.object({
    ttl: Joi.number().min(300).default(86400),
    maxSessionsPerUser: Joi.number().min(1).max(20).default(5),
    prefix: Joi.string().default('session:'),
});

export const queueConfigSchema = Joi.object({
    prefix: Joi.string().default('queue:'),
    defaultPriority: Joi.number().min(-10).max(10).default(0),
    maxRetries: Joi.number().min(1).max(10).default(3),
    concurrency: Joi.object({
        mail: Joi.number().min(1).max(50).default(5),
        notifications: Joi.number().min(1).max(50).default(10),
        dataProcessing: Joi.number().min(1).max(20).default(3),
    }).required(),
});

export const workerConfigSchema = Joi.object({
    mailConcurrency: Joi.number().min(1).max(50).default(5),
    notificationConcurrency: Joi.number().min(1).max(50).default(10),
    dataProcessingConcurrency: Joi.number().min(1).max(20).default(3),
});

export const rateLimitConfigSchema = Joi.object({
    windowMs: Joi.number().min(1000).default(900000), // 15 minutes
    maxRequests: Joi.number().min(1).max(10000).default(100),
    skipSuccessfulRequests: Joi.boolean().default(false),
    skipFailedRequests: Joi.boolean().default(false),
});

export const securityConfigSchema = Joi.object({
    bcryptRounds: Joi.number().min(10).max(15).default(12),
    passwordMinLength: Joi.number().min(8).max(128).default(8),
    passwordRequireUppercase: Joi.boolean().default(true),
    passwordRequireLowercase: Joi.boolean().default(true),
    passwordRequireNumbers: Joi.boolean().default(true),
    passwordRequireSymbols: Joi.boolean().default(false),
    sessionSecret: Joi.string().min(32).required(),
    cookieSecret: Joi.string().min(32).required(),
});

export const monitoringConfigSchema = Joi.object({
    enableMetrics: Joi.boolean().default(true),
    enableHealthCheck: Joi.boolean().default(true),
    healthCheckPath: Joi.string().default('/health'),
    metricsPath: Joi.string().default('/metrics'),
    enablePrometheus: Joi.boolean().default(false),
    prometheusPort: Joi.number().port().when('enablePrometheus', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional(),
    }),
});

export const externalServicesConfigSchema = Joi.object({
    aws: Joi.object({
        region: Joi.string().required(),
        accessKeyId: Joi.string().required(),
        secretAccessKey: Joi.string().required(),
        s3Bucket: Joi.string().optional(),
    }).optional(),
    stripe: Joi.object({
        publicKey: Joi.string().required(),
        secretKey: Joi.string().required(),
        webhookSecret: Joi.string().required(),
    }).optional(),
    sendgrid: Joi.object({
        apiKey: Joi.string().required(),
        fromEmail: Joi.string().email().required(),
    }).optional(),
    twilio: Joi.object({
        accountSid: Joi.string().required(),
        authToken: Joi.string().required(),
        fromNumber: Joi.string().required(),
    }).optional(),
});

export const urlConfigSchema = Joi.object({
    assessmentsUrl: Joi.string().uri().required(),
    loginUrl: Joi.string().uri().required(),
    registerUrl: Joi.string().uri().required(),
    dashboardUrl: Joi.string().uri().required(),
    leaderboardUrl: Joi.string().uri().required(),
    resultUrl: Joi.string().uri().required(),
});

export const judge0UrlConfigSchema = Joi.object({
    first: Joi.string().uri().required(),
    second: Joi.string().uri().optional(),
    third: Joi.string().uri().optional(),
    fourth: Joi.string().uri().optional(),
    fifth: Joi.string().uri().optional(),
});


export const environmentConfigSchema = Joi.object({
    app: appConfigSchema.required(),
    database: databaseConfigSchema.required(),
    redis: redisConfigSchema.required(),
    jwt: jwtConfigSchema.required(),
    security: securityConfigSchema.required(),
    smtp: smtpConfigSchema.required(),
    externalServices: externalServicesConfigSchema.required(),
    urlConfig: urlConfigSchema.required(),
    cache: cacheConfigSchema.required(),
    session: sessionConfigSchema.required(),
    queue: queueConfigSchema.required(),
    judge0Url: judge0UrlConfigSchema.required(),
    worker: workerConfigSchema.required(),
    rateLimit: rateLimitConfigSchema.required(),
    logging: loggingConfigSchema.required(),
    monitoring: monitoringConfigSchema.required(),
});
