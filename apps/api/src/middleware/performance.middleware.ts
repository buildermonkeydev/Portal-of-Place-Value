import { Request, Response, NextFunction } from 'express';
import logger from '@repo/logger';

interface PerformanceMetrics {
    totalRequests: number;
    totalResponseTime: number;
    averageResponseTime: number;
    slowRequests: number;
    errorCount: number;
    requestsPerSecond: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        totalRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorCount: 0,
        requestsPerSecond: 0,
        memoryUsage: process.memoryUsage(),
        uptime: 0
    };

    private requestCounts: number[] = [];
    private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second
    private readonly MEMORY_WARNING_THRESHOLD = 1.5 * 1024 * 1024 * 1024;

    constructor() {
        // Update metrics every 30 seconds
        setInterval(() => this.updateMetrics(), 30000);

        // Log performance summary every 5 minutes
        setInterval(() => this.logPerformanceSummary(), 300000);

        // Monitor memory usage
        setInterval(() => this.monitorMemoryUsage(), 60000);
    }

    middleware = () => {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = Date.now();
            const startMemory = process.memoryUsage();

            // Track request start
            this.requestCounts.push(Date.now());

            // Clean up old request counts (keep only last minute)
            const oneMinuteAgo = Date.now() - 60000;
            this.requestCounts = this.requestCounts.filter(time => time > oneMinuteAgo);

            // Intercept response
            const originalSend = res.send;
            const originalJson = res.json;
            const originalEnd = res.end;

            const trackResponse = (body?: any) => {
                const duration = Date.now() - startTime;
                const endMemory = process.memoryUsage();

                // Update metrics
                this.metrics.totalRequests++;
                this.metrics.totalResponseTime += duration;
                this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests;

                if (duration > this.SLOW_REQUEST_THRESHOLD) {
                    this.metrics.slowRequests++;
                    logger.warn('Slow request detected', 'PerformanceMonitor', {
                        method: req.method,
                        url: req.url,
                        duration: `${duration}ms`,
                        statusCode: res.statusCode,
                        userAgent: req.get('User-Agent'),
                        ip: req.ip
                    });
                }

                if (res.statusCode >= 400) {
                    this.metrics.errorCount++;
                }

                // Log high memory usage
                const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
                if (memoryIncrease > 10 * 1024 * 1024) {
                    logger.warn('High memory usage for request', 'PerformanceMonitor', {
                        method: req.method,
                        url: req.url,
                        memoryIncrease: `${Math.round(memoryIncrease / 1024 / 1024)}MB`,
                        totalMemory: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`
                    });
                }

                // Log performance for important endpoints
                if (this.isImportantEndpoint(req.url)) {
                    logger.info('Request performance', 'PerformanceMonitor', {
                        method: req.method,
                        url: req.url,
                        duration: `${duration}ms`,
                        statusCode: res.statusCode,
                        memoryUsed: `${Math.round(memoryIncrease / 1024)}KB`
                    });
                }
            };

            res.send = function (body: any) {
                trackResponse(body);
                return originalSend.call(this, body);
            };

            res.json = function (body: any) {
                trackResponse(body);
                return originalJson.call(this, body);
            };

            res.end = function (chunk?: any, encoding?: any, cb?: any) {
                trackResponse(chunk);
                return originalEnd.call(this, chunk, encoding, cb);
            };

            next();
        };
    };

    private updateMetrics(): void {
        this.metrics.requestsPerSecond = this.requestCounts.length / 60; // requests per second
        this.metrics.memoryUsage = process.memoryUsage();
        this.metrics.uptime = process.uptime();
    }

    private monitorMemoryUsage(): void {
        const memUsage = process.memoryUsage();

        if (memUsage.heapUsed > this.MEMORY_WARNING_THRESHOLD) {
            logger.warn('High memory usage detected', 'PerformanceMonitor', {
                heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024 / 1024 * 100) / 100}GB`,
                heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024 / 1024 * 100) / 100}GB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
                rss: `${Math.round(memUsage.rss / 1024 / 1024 / 1024 * 100) / 100}GB`
            });
        }
    }

    private logPerformanceSummary(): void {
        logger.info('Performance Summary', 'PerformanceMonitor', {
            totalRequests: this.metrics.totalRequests,
            averageResponseTime: `${Math.round(this.metrics.averageResponseTime)}ms`,
            slowRequests: this.metrics.slowRequests,
            errorRate: `${Math.round((this.metrics.errorCount / this.metrics.totalRequests) * 100)}%`,
            requestsPerSecond: Math.round(this.metrics.requestsPerSecond),
            memoryUsage: {
                heapUsed: `${Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(this.metrics.memoryUsage.heapTotal / 1024 / 1024)}MB`,
                rss: `${Math.round(this.metrics.memoryUsage.rss / 1024 / 1024)}MB`
            },
            uptime: `${Math.round(this.metrics.uptime / 60)} minutes`
        });
    }

    private isImportantEndpoint(url: string): boolean {
        const importantEndpoints = [
            '/api/v1/auth/login',
            '/api/v1/auth/register',
            '/api/v1/code-execution/execute',
            '/api/v1/assessments',
            '/api/v1/users'
        ];

        return importantEndpoints.some(endpoint => url.includes(endpoint));
    }

    getMetrics(): PerformanceMetrics {
        this.updateMetrics();
        return { ...this.metrics };
    }

    resetMetrics(): void {
        this.metrics = {
            totalRequests: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            slowRequests: 0,
            errorCount: 0,
            requestsPerSecond: 0,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
        this.requestCounts = [];
    }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export middleware
export const performanceMiddleware = performanceMonitor.middleware;
