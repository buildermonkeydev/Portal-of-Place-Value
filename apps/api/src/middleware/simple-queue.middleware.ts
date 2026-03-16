import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import logger from '@repo/logger';

interface QueuedRequest {
  id: string;
  req: Request;
  res: Response;
  next: NextFunction;
  timestamp: number;
  priority: number;
}

class SimpleRequestQueue extends EventEmitter {
  private queue: QueuedRequest[] = [];
  private processing: Set<string> = new Set();
  private maxConcurrent: number = 400;
  private maxQueueSize: number = 5000;
  private stats = {
    totalQueued: 0,
    totalProcessed: 0,
    totalRejected: 0,
    currentQueueSize: 0,
    currentProcessing: 0
  };

  constructor() {
    super();
    setInterval(() => this.processNext(), 10);
  }

  middleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.path === '/status' || req.path === '/health') {
        return next();
      }

      const requestId = this.generateId();
      const priority = this.getPriority(req);

      if (this.queue.length >= this.maxQueueSize) {
        this.stats.totalRejected++;
        logger.warn('Request queue full, rejecting request', 'SimpleRequestQueue', {
          requestId,
          queueSize: this.queue.length,
          maxQueueSize: this.maxQueueSize
        });

        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Server is busy. Please try again later.',
          retryAfter: 1,
          timestamp: new Date().toISOString()
        });
      }

      // Add to queue
      const queuedRequest: QueuedRequest = {
        id: requestId,
        req,
        res,
        next,
        timestamp: Date.now(),
        priority
      };

      this.queue.push(queuedRequest);
      this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first

      this.stats.totalQueued++;
      this.stats.currentQueueSize = this.queue.length;

      this.emit('requestQueued', { requestId, queueSize: this.queue.length });

      // Set timeout
      setTimeout(() => {
        this.removeRequest(requestId);
        if (!res.headersSent) {
          res.status(408).json({
            error: 'Request Timeout',
            message: 'Request timed out in queue',
            timestamp: new Date().toISOString()
          });
        }
      }, 10000);
    };
  };

  private processNext(): void {
    // Don't process if at max concurrent or no requests
    if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    // Check system resources before processing (increased threshold for 30GB RAM)
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 2 * 1024 * 1024 * 1024) { // 2GB threshold for 30GB RAM
      logger.warn('High memory usage, skipping request processing', 'SimpleRequestQueue', {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
      });
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.processing.add(request.id);
    this.stats.currentProcessing = this.processing.size;
    this.stats.currentQueueSize = this.queue.length;

    this.emit('requestProcessing', { requestId: request.id });

    // Process the request
    try {
      // Call next() to continue with the middleware chain
      request.next();

      // Mark as completed after a short delay
      setTimeout(() => {
        this.completeRequest(request.id);
      }, 50);
    } catch (error: any) {
      logger.error('Error processing queued request', 'SimpleRequestQueue', {
        requestId: request.id,
        error: error.message
      });
      this.completeRequest(request.id);
    }
  }

  private completeRequest(requestId: string): void {
    this.processing.delete(requestId);
    this.stats.totalProcessed++;
    this.stats.currentProcessing = this.processing.size;

    this.emit('requestCompleted', { requestId });
  }

  private removeRequest(requestId: string): void {
    const index = this.queue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.stats.currentQueueSize = this.queue.length;
    }
  }

  private getPriority(req: Request): number {
    // Higher number = higher priority
    if (req.path === '/status' || req.path === '/health') return 10;
    if (req.path.includes('/auth/login')) return 9;
    if (req.path.includes('/auth/register')) return 8;
    if (req.method === 'GET') return 5;
    if (req.method === 'POST') return 3;
    if (req.method === 'PUT' || req.method === 'PATCH') return 2;
    return 1;
  }

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    return {
      ...this.stats,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize,
      isProcessing: this.processing.size > 0
    };
  }

  shutdown(): void {
    this.removeAllListeners();
  }
}

// Create request queue instance
export const simpleRequestQueue = new SimpleRequestQueue();
