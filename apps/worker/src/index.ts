import 'dotenv/config';
// Export types
export * from './types/queue.types';
import { RedisLibrary } from '@repo/redis-lib';
import { WorkerApp } from './Worker';
import logger from '@repo/logger';
import { getConfig } from '@repo/env-config';
async function main() {
    try {
        logger.info('Starting worker application...', 'Main');

        // Get configuration
        const config = getConfig();
        logger.info('Configuration loaded', 'Main', {
            environment: config.getApp().environment,
            appName: config.getApp().name,
            version: config.getApp().version
        });

        // Initialize Redis library with environment variables
        const redisLib = RedisLibrary.fromEnvironment();
        await redisLib.initialize();

        // Create and start worker app
        const workerApp = new WorkerApp(redisLib.getRedisClient());
        await workerApp.start();

        // Log worker status
        const status = workerApp.getStatus();
        logger.info('Worker application status', 'Main', status);

        // Keep the process running
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', 'Main', { error: error.message });
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection', 'Main', { reason, promise });
            process.exit(1);
        });

    } catch (error) {
        console.log("Failed to start worker application", error)
        logger.error('Failed to start worker application', 'Main', { error });
        process.exit(1);
    }
}

// Start the application
main().catch((error) => {
    logger.error('Fatal error in worker application', 'Main', { error });
    process.exit(1);
});
