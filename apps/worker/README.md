# Worker Application

Background job worker application using BullMQ for processing queued tasks.

## Features

- **Mail Processing**: Handles registration, forgot password, and reset password emails
- **Notification Processing**: Processes push notifications, SMS, and in-app notifications
- **Data Processing**: Handles image resizing, PDF generation, and data export jobs
- **Scalable**: Multiple workers with configurable concurrency
- **Reliable**: Built on BullMQ with Redis for job persistence
- **Template Engine**: Handlebars templates for email formatting

## Queues

### Mail Queue (`mail-queue`)
- **register**: User registration confirmation emails
- **forgot-password**: Password reset request emails
- **reset-password**: Password reset completion emails

### Notifications Queue (`notifications-queue`)
- **push**: Push notifications
- **sms**: SMS notifications
- **in-app**: In-app notifications

### Data Processing Queue (`data-processing-queue`)
- **image-resize**: Image resizing jobs
- **pdf-generate**: PDF generation jobs
- **data-export**: Data export jobs

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=your_redis_password

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@Bl-compiler.com

# App Configuration
APP_NAME=Bl-compiler
APP_URL=https://Bl-compiler.com
APP_DOMAIN=Bl-compiler.com
HELP_URL=https://Bl-compiler.com/help

# Worker Configuration
WORKER_MAIL_CONCURRENCY=5
NOTIFICATION_WORKER_CONCURRENCY=10
WORKER_DATA_PROCESSING_CONCURRENCY=3
```

## Usage

### Development
```bash
pnpm dev
```

### Production
```bash
pnpm build
pnpm start
```

### Docker
```bash
docker build -t worker-app .
docker run -d --env-file .env worker-app
```

## Email Templates

Email templates are located in `src/templates/` and use Handlebars syntax:

- `register.hbs` - User registration email
- `forgot-password.hbs` - Password reset request email
- `reset-password.hbs` - Password reset completion email
- `welcome.hbs` - Welcome email

### Template Variables

All templates have access to:
- `appName` - Application name
- `appUrl` - Application URL
- `appDomain` - Application domain
- `helpUrl` - Help center URL

Job-specific variables are passed in the `data` object.

## Adding New Queues

1. Add queue name to `QUEUE_NAMES` in `packages/redis-lib/src/queue/types.ts`
2. Create processor in `src/processors/`
3. Add worker in `src/Worker.ts`
4. Update job types in `packages/redis-lib/src/queue/types.ts`

## Monitoring

The worker application logs all job processing activities. Monitor logs for:
- Job completion/failure
- Worker status
- Queue statistics
- Error handling

## Scaling

To scale the worker application:

1. **Horizontal Scaling**: Run multiple worker instances
2. **Vertical Scaling**: Increase worker concurrency
3. **Queue-specific Scaling**: Adjust concurrency per queue type

## Error Handling

- Jobs are automatically retried on failure
- Failed jobs are logged with error details
- Dead letter queues for permanently failed jobs
- Graceful shutdown handling

## Health Checks

The worker application provides health check endpoints:
- Worker status
- Queue statistics
- Redis connection status
- SMTP connection status
