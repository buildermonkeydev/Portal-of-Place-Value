import { json, urlencoded } from "body-parser";
import express, { type Express } from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import { database } from "./core/infrastructure/Database";
import { redisService } from "./core/infrastructure/Redis";
import { getConfig } from "@repo/env-config";
import { queueRoutes } from "./apps/queue.routes";
import { performanceMiddleware, performanceMonitor } from "./middleware/performance.middleware";
import { connectionPoolMiddleware } from "./middleware/connection-pool.middleware";
import { memoryManagementMiddleware } from "./middleware/memory-management.middleware";
import { simpleRequestQueue } from "./middleware/simple-queue.middleware";
import router from "./apps/routes";
import { GlobalErrorHandler, NotFoundHandler } from "./middleware/error-handler";
import { logger, logStream } from "./utils/logger";
export const createServer = (): Express => {
  try {
    logger.info('Creating Express application...', 'Server');
    const app = express();
    const config = getConfig();
    logger.info('Express app and config created', 'Server');

    logger.info('Setting up middleware...', 'Server');
    app
      .disable("x-powered-by")
      .use(compression({
        level: 6,
        threshold: 1024,
        filter: (req: any, res: any) => {
          if (typeof req.headers.get === 'function' && req.headers.get('x-no-compression')) return false;
          if ((req.headers as any)['x-no-compression']) return false;
          return compression.filter(req, res);
        }
      }))
      .use(morgan("combined", { stream: logStream }))
      // .use(performanceMiddleware()) 
      // .use(connectionPoolMiddleware()) 
      // .use(memoryManagementMiddleware()) 
      .use(urlencoded({ extended: true, limit: '5mb' }))
      .use(json({ limit: '5mb' }))
      .use(cookieParser())
      .use(cors({
        origin: config.getApp().cors.origin,
        credentials: config.getApp().cors.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        exposedHeaders: ['Content-Length', 'X-Request-Id'],
        optionsSuccessStatus: 200,
      }));
    logger.info('Middleware setup complete', 'Server');

    // app.get("/status", async (req, res) => {
    //   const dbStatus = database.getConnectionStatus();
    //   const redisHealth = await redisService.healthCheck();
    //   const queueStats = simpleRequestQueue.getStats();
    //   const performanceMetrics = performanceMonitor.getMetrics();

    //   logger.info('Health check requested', 'HealthCheck', {
    //     ip: req.ip,
    //     userAgent: req.get('User-Agent')
    //   });

    //   const isHealthy = dbStatus && redisHealth.status === 'healthy';

    //   return res.status(isHealthy ? 200 : 503).json({
    //     ok: isHealthy,
    //     timestamp: new Date().toISOString(),
    //     uptime: process.uptime(),
    //     memory: process.memoryUsage(),
    //     database: {
    //       connected: dbStatus,
    //     },
    //     // redis: redisHealth,
    //     // queue: queueStats,
    //     // performance: {
    //     //   totalRequests: performanceMetrics.totalRequests,
    //     //   averageResponseTime: Math.round(performanceMetrics.averageResponseTime),
    //     //   requestsPerSecond: Math.round(performanceMetrics.requestsPerSecond),
    //     //   slowRequests: performanceMetrics.slowRequests,
    //     //   errorRate: performanceMetrics.totalRequests > 0
    //     //     ? Math.round((performanceMetrics.errorCount / performanceMetrics.totalRequests) * 100)
    //     //     : 0
    //     // }
    //   });
    // });

    app.get("/", (req, res) => {
      return res.json({
        message: "Hello World",
        // queue: simpleRequestQueue.getStats()
      });
    });

    // Database connection endpoint (for testing)
    // app.get("/db/status", (req, res) => {
    //   const dbStatus = database.getConnectionStatus();
    //   // const dbStats = database.getConnectionStats();

    //   return res.json({
    //     // connected: dbStatus,
    //     // stats: dbStats
    //   });
    // });



    app.use(simpleRequestQueue.middleware());
    const initializeRoutes = () => {
      logger.info('Initializing routes...', 'Server');
      app.use('/', router);
      logger.info('Routes initialized successfully', 'Server');
    }

    initializeRoutes();

    logger.info('Setting up error handlers...', 'Server');
    app.use(NotFoundHandler);
    app.use(GlobalErrorHandler);
    logger.info('Error handlers setup complete', 'Server');

    logger.info('Express server creation completed', 'Server');
    return app;
  } catch (error) {
    logger.error('Failed to create Express server', 'Server', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};
