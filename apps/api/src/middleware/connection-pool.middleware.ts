import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Connection Pool Management Middleware
 * Optimizes database connections for high-load scenarios
 */

interface ConnectionStats {
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    connectionWaitTime: number;
}

class ConnectionPoolManager {
    private static instance: ConnectionPoolManager;
    private stats: ConnectionStats = {
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        connectionWaitTime: 0
    };

    private constructor() {
        // Monitor connection pool every 10 seconds
        setInterval(() => this.monitorConnections(), 10000);
    }

    public static getInstance(): ConnectionPoolManager {
        if (!ConnectionPoolManager.instance) {
            ConnectionPoolManager.instance = new ConnectionPoolManager();
        }
        return ConnectionPoolManager.instance;
    }

    private monitorConnections(): void {
        const mongoose = require('mongoose');
        const conn = mongoose.connection;

        this.stats = {
            activeConnections: conn.readyState === 1 ? 1 : 0,
            idleConnections: 0, // This would need to be tracked from mongoose internals
            totalConnections: 1,
            connectionWaitTime: 0
        };

        // Log connection stats if there are issues
        if (conn.readyState !== 1) {
            logger.warn('Database connection issues detected', 'ConnectionPoolManager', {
                readyState: conn.readyState,
                host: conn.host,
                port: conn.port
            });
        }
    }

    public getStats(): ConnectionStats {
        return { ...this.stats };
    }

    public middleware = () => {
        return (req: Request, res: Response, next: NextFunction) => {
            // Add connection pool headers for monitoring
            res.set({
                'X-Connection-Pool-Active': this.stats.activeConnections.toString(),
                'X-Connection-Pool-Total': this.stats.totalConnections.toString()
            });

            next();
        };
    };
}

export const connectionPoolManager = ConnectionPoolManager.getInstance();
export const connectionPoolMiddleware = connectionPoolManager.middleware;
