# Redis Library

A production-level Redis client library with comprehensive features including caching, session management, queuing, and pub/sub capabilities.

## Features

- **Redis Client**: High-performance Redis client with connection pooling and error handling
- **Cache Manager**: Advanced caching with TTL, serialization, and statistics
- **Session Manager**: User session management with automatic cleanup
- **Queue Manager**: Job queue with priority, retry logic, and delayed execution
- **Pub/Sub Manager**: Publish/subscribe messaging with pattern matching
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Production Ready**: Comprehensive error handling, logging, and monitoring

## Installation

```bash
pnpm add @repo/redis-lib
```

## Quick Start

### Using Environment Variables (Recommended)

```typescript
import { RedisLibrary } from '@repo/redis-lib';

// Create instance with environment variables
const redisLib = RedisLibrary.fromEnvironment();

// Initialize
await redisLib.initialize();
```

### Using Configuration Object

```typescript
import { RedisLibrary } from '@repo/redis-lib';

const redisLib = new RedisLibrary({
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'your-password'
  },
  cache: {
    ttl: 3600,
    prefix: 'app:'
  },
  session: {
    ttl: 24 * 60 * 60,
    maxSessionsPerUser: 5
  }
});

// Initialize
await redisLib.initialize();

// Use cache
const cache = redisLib.getCacheManager();
await cache.set('user:123', { name: 'John', email: 'john@example.com' });
const user = await cache.get('user:123');

// Use sessions
const session = redisLib.getSessionManager();
await session.createSession('user123', 'session456');
const sessionData = await session.getSession('session456');

// Use queues
const queue = redisLib.getQueueManager();
await queue.addJob('email-queue', { to: 'user@example.com', subject: 'Welcome!' });
const job = await queue.getNextJob('email-queue');

// Use pub/sub
const pubsub = redisLib.getPubSubManager();
await pubsub.subscribe('notifications', (channel, message) => {
  console.log('Received:', message);
});
await pubsub.publish('notifications', { type: 'welcome', userId: '123' });
```

## Components

### Redis Client

Core Redis client with connection management and error handling.

```typescript
import { RedisClient } from '@repo/redis-lib/client';

const client = new RedisClient({
  host: 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: null
});

await client.connect();
const pong = await client.ping();
```

### Cache Manager

Advanced caching with TTL, serialization, and statistics.

```typescript
import { CacheManager } from '@repo/redis-lib/cache';

const cache = new CacheManager(redisClient, {
  ttl: 3600,
  prefix: 'cache:',
  serialize: true
});

// Set cache
await cache.set('user:123', { name: 'John' }, { ttl: 1800 });

// Get cache
const user = await cache.get('user:123');

// Batch operations
await cache.mset([
  { key: 'user:1', value: { name: 'Alice' } },
  { key: 'user:2', value: { name: 'Bob' } }
]);

const users = await cache.mget(['user:1', 'user:2']);
```

### Session Manager

User session management with automatic cleanup and limits.

```typescript
import { SessionManager } from '@repo/redis-lib/session';

const session = new SessionManager(redisClient, {
  ttl: 24 * 60 * 60,
  maxSessionsPerUser: 5,
  extendOnActivity: true
});

// Create session
const sessionData = await session.createSession(
  'user123',
  'session456',
  'Mozilla/5.0...',
  '192.168.1.1'
);

// Get session
const data = await session.getSession('session456');

// Update session
await session.updateSession('session456', { data: { theme: 'dark' } });

// Cleanup expired sessions
const cleaned = await session.cleanupExpiredSessions();
```

### Queue Manager

Job queue with priority, retry logic, and delayed execution.

```typescript
import { QueueManager } from '@repo/redis-lib/queue';

const queue = new QueueManager(redisClient, {
  defaultPriority: 0,
  defaultMaxAttempts: 3,
  visibilityTimeout: 300
});

// Add job
const jobId = await queue.addJob('email-queue', {
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Welcome to our service!'
}, {
  priority: 1,
  delay: 5000 // 5 seconds delay
});

// Process job
const job = await queue.getNextJob('email-queue');
if (job) {
  try {
    // Process job
    await processEmail(job.data);
    await queue.completeJob('email-queue', job.id);
  } catch (error) {
    await queue.failJob('email-queue', job.id, error.message);
  }
}
```

### Pub/Sub Manager

Publish/subscribe messaging with pattern matching.

```typescript
import { PubSubManager } from '@repo/redis-lib/pubsub';

const pubsub = new PubSubManager(redisClient);
await pubsub.initialize();

// Subscribe to channel
await pubsub.subscribe('notifications', (channel, message) => {
  console.log(`Received on ${channel}:`, message);
});

// Subscribe to pattern
await pubsub.subscribe('user:*', (channel, message) => {
  console.log(`User event on ${channel}:`, message);
}, { pattern: true });

// Publish message
await pubsub.publish('notifications', {
  type: 'welcome',
  userId: '123',
  message: 'Welcome!'
});
```

## Environment Variables

The library supports configuration through environment variables. Copy `env.example` to `.env` and configure:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/0
# OR individual settings:
REDIS_PASSWORD=your_redis_password

# Cache Configuration
REDIS_CACHE_TTL=3600
REDIS_CACHE_PREFIX=cache:
REDIS_CACHE_MAX_KEYS=10000

# Session Configuration
REDIS_SESSION_TTL=86400
REDIS_SESSION_MAX_PER_USER=5
REDIS_SESSION_PREFIX=session:

# Queue Configuration
REDIS_QUEUE_PREFIX=queue:
REDIS_QUEUE_DEFAULT_PRIORITY=0
REDIS_QUEUE_MAX_RETRIES=3
```

### Environment Variable Priority

1. **REDIS_URL** - Complete Redis connection string (highest priority)
2. **Individual Redis settings** - REDIS_PASSWORD, REDIS_HOST, etc.
3. **Configuration object** - Passed to constructor
4. **Default values** - Library defaults

## Configuration

### Redis Configuration

```typescript
interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  // Cluster configuration
  cluster?: {
    enableReadyCheck?: boolean;
    maxRedirections?: number;
    retryDelayOnFailover?: number;
    scaleReads?: 'master' | 'slave' | 'all';
  };
  // Sentinel configuration
  sentinel?: {
    sentinels: Array<{ host: string; port: number }>;
    name: string;
    password?: string;
    db?: number;
    role?: 'master' | 'slave';
  };
}
```

### Cache Configuration

```typescript
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  serialize?: boolean; // Whether to serialize/deserialize values
  compress?: boolean; // Whether to compress values
}
```

### Session Configuration

```typescript
interface SessionOptions {
  ttl?: number; // Session TTL in seconds
  prefix?: string; // Key prefix
  extendOnActivity?: boolean; // Extend TTL on activity
  maxSessionsPerUser?: number; // Maximum sessions per user
}
```

### Queue Configuration

```typescript
interface QueueOptions {
  prefix?: string;
  defaultPriority?: number;
  defaultMaxAttempts?: number;
  visibilityTimeout?: number; // Time in seconds before job becomes available again
  retryDelay?: number; // Delay between retries in seconds
}
```

## Monitoring and Statistics

```typescript
// Get comprehensive statistics
const stats = await redisLib.getStats();
console.log('Redis Stats:', stats.redis);
console.log('Cache Stats:', stats.cache);
console.log('Session Stats:', stats.session);
console.log('Queue Stats:', stats.queue);
console.log('PubSub Stats:', stats.pubsub);

// Health check
const health = await redisLib.healthCheck();
console.log('Status:', health.status);
console.log('Details:', health.details);

// Cleanup expired data
const cleanup = await redisLib.cleanup();
console.log('Cleaned sessions:', cleanup.sessions);
console.log('Cleaned queue jobs:', cleanup.queueJobs);
```

## Error Handling

The library includes comprehensive error handling with automatic retries and fallbacks:

```typescript
try {
  await redisLib.initialize();
} catch (error) {
  console.error('Failed to initialize Redis library:', error);
  // Handle initialization failure
}

// Individual operations also handle errors gracefully
const user = await cache.get('user:123');
if (user === null) {
  // Handle cache miss
}
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## Development

```bash
# Build the library
pnpm build

# Type check
pnpm type-check

# Clean build artifacts
pnpm clean

# Watch mode for development
pnpm dev
```

## License

ISC
