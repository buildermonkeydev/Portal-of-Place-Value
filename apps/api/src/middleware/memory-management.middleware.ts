import { Request, Response, NextFunction } from 'express';
import logger from '@repo/logger';

/**
 * Memory Management Middleware
 * Monitors and manages memory usage for high-load scenarios
 */

interface MemoryStats {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    usagePercentage: number;
}

class MemoryManager {
    private static instance: MemoryManager;
    private memoryThreshold = 0.8;
    private gcInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.gcInterval = setInterval(() => {
            if (global.gc) {
                global.gc();
                logger.debug('Forced garbage collection', 'MemoryManager');
            }
        }, 30000);
    }

    public static getInstance(): MemoryManager {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }

    public getMemoryStats(): MemoryStats {
        const memUsage = process.memoryUsage();
        const totalMemory = 30 * 1024 * 1024 * 1024; // 30GB in bytes
        const usagePercentage = (memUsage.heapUsed / totalMemory) * 100;

        return {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
            usagePercentage
        };
    }

    public shouldThrottle(): boolean {
        const stats = this.getMemoryStats();
        return stats.usagePercentage > (this.memoryThreshold * 100);
    }

    public middleware = () => {
        return (req: Request, res: Response, next: NextFunction) => {
            const stats = this.getMemoryStats();

            // Add memory headers for monitoring
            res.set({
                'X-Memory-Used': Math.round(stats.heapUsed / 1024 / 1024).toString() + 'MB',
                'X-Memory-Percentage': Math.round(stats.usagePercentage).toString() + '%'
            });

            // Throttle requests if memory usage is too high
            if (this.shouldThrottle()) {
                logger.warn('High memory usage detected, throttling requests', 'MemoryManager', {
                    usagePercentage: Math.round(stats.usagePercentage),
                    heapUsed: Math.round(stats.heapUsed / 1024 / 1024) + 'MB'
                });

                // Add small delay to reduce memory pressure
                setTimeout(() => {
                    next();
                }, 10);
            } else {
                next();
            }
        };
    };

    public shutdown(): void {
        if (this.gcInterval) {
            clearInterval(this.gcInterval);
        }
    }
}

export const memoryManager = MemoryManager.getInstance();
export const memoryManagementMiddleware = memoryManager.middleware;
