console.log("STEPS")
import 'dotenv/config';
console.log("STEP 2");
import { createServer } from "./server";
console.log("STEP 3");
import { redisService } from "./core/infrastructure/Redis";
console.log("STEP 4");
import { getConfig } from "@repo/env-config";
console.log("STEP 5");
import { logger } from './utils/logger';
console.log("STEP 6");
import { jobCompletionListener } from './core/infrastructure/JobCompletionListener';
console.log("STEP 7");
import { database } from './core/infrastructure/Database';
console.log("STEP 8");

const config = getConfig();
const port = config.getApp().port;
const host = config.getApp().host;

async function startServer() {
  try {
    // Suppress Mongoose warnings to prevent app crashes
    process.removeAllListeners('warning');
    process.on('warning', (warning) => {
      if (warning.name === 'MongooseWarning' && warning.message.includes('Duplicate schema index')) {
        logger.warn('Mongoose duplicate index warning suppressed', 'Server', { warning: warning.message });
        return; // Don't crash on duplicate index warnings
      }
      logger.warn('Process warning', 'Server', { warning: warning.message, name: warning.name });
    });

    logger.info('Starting API server...', 'Server');
    logger.info('Configuration loaded', 'Server', {
      port,
      host,
      environment: config.getApp().environment,
      nodeEnv: process.env.NODE_ENV,
      processId: process.pid
    });

    logger.info('Attempting to connect to database...', 'Server');
    await database.connect();
    logger.info('Database connection established', 'Server');

    logger.info('Attempting to initialize Redis service...', 'Server');
    await redisService.initialize();
    logger.info('Redis service initialized', 'Server');

    // Start job completion listener
    logger.info('Starting job completion listener...', 'Server');
    await jobCompletionListener.start();
    logger.info('Job completion listener started', 'Server');

    logger.info('Creating Express server...', 'Server');
    const app = createServer();
    logger.info('Express server created successfully', 'Server');

    logger.info('Starting server listener...', 'Server');
    const server = app.listen(
      {
        port,
        host
      },
      () => {
        logger.info(`API server running on ${host}:${port}`, 'Server', {
          port,
          host,
          environment: config.getApp().environment,
          dbConnected: database.getConnectionStatus(),
          processId: process.pid
        });
      }
    );

    // Add error handlers for the server
    server.on('error', (error: any) => {
      logger.error('Server error occurred', 'Server', {
        error: error.message,
        code: error.code,
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      });
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`, 'Server');
      server.close(() => {
        logger.info('HTTP server closed', 'Server');
      });
      await redisService.shutdown();
      await database.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Add uncaught exception handler
    process.on('uncaughtException', (error) => {
      console.error("UNCAUGHT EXCEPTION:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      logger.error('Uncaught Exception', 'Server', {
        error: error.message,
        stack: error.stack,
        name: error.name,
      });
      process.exit(1);
    });

    // Add unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      console.error("UNHANDLED REJECTION:", reason);
      console.error("Promise:", promise);
      if (reason instanceof Error) {
        console.error("Error message:", reason.message);
        console.error("Error stack:", reason.stack);
      }
      logger.error('Unhandled Rejection', 'Server', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: promise.toString(),
        stack: reason instanceof Error ? reason.stack : undefined,
        name: reason instanceof Error ? reason.name : undefined
      });
      process.exit(1);
    });

  } catch (error: any) {
    console.error("FAILED TO START SERVER:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    logger.error('Failed to start server', 'Server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    process.exit(1);
  }
}

startServer();
