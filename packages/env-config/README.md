# Environment Configuration Package

A centralized, type-safe environment configuration package for managing environment variables across all applications and packages in the monorepo.

## Features

- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Validation**: Joi-based validation for all configuration sections
- **Environment Detection**: Automatic environment detection (development, staging, production)
- **Centralized Management**: Single source of truth for all environment variables
- **Flexible Loading**: Support for multiple environment files (.env, .env.local, .env.{environment})
- **Utility Functions**: Helper functions for common environment variable operations
- **Configuration Builder**: Fluent API for building custom configurations

## Installation

```bash
pnpm add @repo/env-config
```

## Quick Start

### Basic Usage

```typescript
import { getConfig } from '@repo/env-config';

// Get configuration instance
const config = getConfig();

// Access configuration sections
const appConfig = config.getApp();
const dbConfig = config.getDatabase();
const redisConfig = config.getRedis();
```

### Initialize with Options

```typescript
import { initializeConfig } from '@repo/env-config';

const config = initializeConfig({
  environment: 'production',
  configPath: '.env.production',
  validateOnLoad: true,
  strictMode: true,
});
```

### Using Utility Functions

```typescript
import { 
  getEnv, 
  getRequiredEnv, 
  getBooleanEnv, 
  getNumberEnv,
  isProduction 
} from '@repo/env-config';

// Get environment variables with type conversion
const port = getNumberEnv('PORT', 3000);
const isSecure = getBooleanEnv('HTTPS', false);
const origins = getArrayEnv('CORS_ORIGINS', ['http://localhost:3000']);

// Check environment
if (isProduction()) {
  // Production-specific logic
}
```

## Configuration Sections

### Application Configuration
- `app.name`: Application name
- `app.version`: Application version
- `app.url`: Application URL
- `app.domain`: Application domain
- `app.environment`: Current environment
- `app.port`: Server port
- `app.host`: Server host
- `app.cors`: CORS configuration

### Database Configuration
- `database.host`: Database host
- `database.port`: Database port
- `database.name`: Database name
- `database.username`: Database username
- `database.password`: Database password
- `database.ssl`: SSL connection flag
- `database.maxConnections`: Maximum connections
- `database.connectionTimeout`: Connection timeout

### Redis Configuration
- `redis.host`: Redis host
- `redis.port`: Redis port
- `redis.password`: Redis password
- `redis.db`: Redis database number
- `redis.url`: Redis connection URL
- `redis.retryDelayOnFailover`: Retry delay
- `redis.maxRetriesPerRequest`: Maximum retries

### SMTP Configuration
- `smtp.host`: SMTP host
- `smtp.port`: SMTP port
- `smtp.secure`: Secure connection flag
- `smtp.user`: SMTP username
- `smtp.pass`: SMTP password
- `smtp.from`: From email address

### JWT Configuration
- `jwt.secret`: JWT secret key
- `jwt.expiresIn`: Token expiration time
- `jwt.refreshSecret`: Refresh token secret
- `jwt.refreshExpiresIn`: Refresh token expiration
- `jwt.issuer`: Token issuer
- `jwt.audience`: Token audience

### Security Configuration
- `security.bcryptRounds`: Bcrypt rounds
- `security.passwordMinLength`: Minimum password length
- `security.passwordRequireUppercase`: Require uppercase letters
- `security.passwordRequireLowercase`: Require lowercase letters
- `security.passwordRequireNumbers`: Require numbers
- `security.passwordRequireSymbols`: Require symbols
- `security.sessionSecret`: Session secret
- `security.cookieSecret`: Cookie secret

### Cache Configuration
- `cache.ttl`: Cache TTL in seconds
- `cache.prefix`: Cache key prefix
- `cache.maxKeys`: Maximum cache keys

### Session Configuration
- `session.ttl`: Session TTL in seconds
- `session.maxSessionsPerUser`: Maximum sessions per user
- `session.prefix`: Session key prefix

### Queue Configuration
- `queue.prefix`: Queue key prefix
- `queue.defaultPriority`: Default job priority
- `queue.maxRetries`: Maximum retries
- `queue.concurrency`: Concurrency settings for different queue types

### Worker Configuration
- `worker.mailConcurrency`: Mail worker concurrency
- `worker.notificationConcurrency`: Notification worker concurrency
- `worker.dataProcessingConcurrency`: Data processing worker concurrency

### Rate Limiting Configuration
- `rateLimit.windowMs`: Rate limit window in milliseconds
- `rateLimit.maxRequests`: Maximum requests per window
- `rateLimit.skipSuccessfulRequests`: Skip successful requests
- `rateLimit.skipFailedRequests`: Skip failed requests

### Logging Configuration
- `logging.level`: Log level (error, warn, info, debug)
- `logging.format`: Log format (json, simple, combined)
- `logging.enableConsole`: Enable console logging
- `logging.enableFile`: Enable file logging
- `logging.filePath`: Log file path
- `logging.maxFiles`: Maximum log files
- `logging.maxSize`: Maximum log file size

### Monitoring Configuration
- `monitoring.enableMetrics`: Enable metrics collection
- `monitoring.enableHealthCheck`: Enable health check endpoint
- `monitoring.healthCheckPath`: Health check path
- `monitoring.metricsPath`: Metrics path
- `monitoring.enablePrometheus`: Enable Prometheus metrics
- `monitoring.prometheusPort`: Prometheus port

## Environment Variables

Copy `env.example` to `.env` and configure your environment variables:

```bash
cp env.example .env
```

### Required Variables

- `APP_URL`: Application URL
- `APP_DOMAIN`: Application domain
- `HELP_URL`: Help URL
- `DB_HOST`: Database host
- `DB_NAME`: Database name
- `SMTP_HOST`: SMTP host
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `SMTP_FROM`: From email
- `JWT_SECRET`: JWT secret key
- `JWT_REFRESH_SECRET`: JWT refresh secret
- `SESSION_SECRET`: Session secret
- `COOKIE_SECRET`: Cookie secret

### Optional Variables

All other variables have sensible defaults and can be configured as needed.

## Advanced Usage

### Configuration Builder

```typescript
import { createConfigBuilder } from '@repo/env-config';

const config = createConfigBuilder()
  .setEnvironment('production')
  .setConfigPath('.env.production')
  .setValidation(true)
  .setStrictMode(true)
  .build();
```

### Custom Validation

```typescript
import { getConfig } from '@repo/env-config';
import { databaseConfigSchema } from '@repo/env-config/validation';

const config = getConfig();
const dbConfig = config.validateSection('database', databaseConfigSchema);
```

### Environment-Specific Configuration

```typescript
import { createEnvironmentConfig } from '@repo/env-config';

const devConfig = createEnvironmentConfig('development');
const prodConfig = createEnvironmentConfig('production');
```

## Integration Examples

### Express Application

```typescript
import { getConfig } from '@repo/env-config';
import express from 'express';

const config = getConfig();
const app = express();

app.listen(config.getApp().port, config.getApp().host, () => {
  console.log(`Server running on ${config.getApp().host}:${config.getApp().port}`);
});
```

### Database Connection

```typescript
import { getConfig } from '@repo/env-config';
import { Pool } from 'pg';

const config = getConfig();
const dbConfig = config.getDatabase();

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.name,
  user: dbConfig.username,
  password: dbConfig.password,
  ssl: dbConfig.ssl,
  max: dbConfig.maxConnections,
  connectionTimeoutMillis: dbConfig.connectionTimeout,
});
```

### Redis Connection

```typescript
import { getConfig } from '@repo/env-config';
import Redis from 'ioredis';

const config = getConfig();
const redisConfig = config.getRedis();

const redis = new Redis({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db,
  retryDelayOnFailover: redisConfig.retryDelayOnFailover,
  maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
  lazyConnect: redisConfig.lazyConnect,
  keepAlive: redisConfig.keepAlive,
  connectTimeout: redisConfig.connectTimeout,
  commandTimeout: redisConfig.commandTimeout,
});
```

## TypeScript Support

The package provides full TypeScript support with:

- Comprehensive type definitions for all configuration sections
- Type-safe access to configuration values
- IntelliSense support in IDEs
- Compile-time validation of configuration usage

## Validation

All configuration sections are validated using Joi schemas:

- Required fields are enforced
- Type validation (string, number, boolean, array)
- Range validation (ports, timeouts, etc.)
- Format validation (URLs, emails, etc.)
- Custom validation rules

## Error Handling

The package provides detailed error messages for:

- Missing required environment variables
- Invalid configuration values
- Validation failures
- Type conversion errors

## License

ISC
