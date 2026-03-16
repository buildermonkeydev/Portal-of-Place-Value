import { EventEmitter } from 'events';
import logger from '@repo/logger';

export interface LeakyBucketConfig {
    capacity: number;        // Maximum requests in bucket
    leakRate: number;        // Requests processed per second
    maxWaitTime: number;     // Maximum wait time in milliseconds
    burstAllowance: number;  // Allow burst up to this limit
}

export interface QueuedRequest {
    id: string;
    timestamp: number;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: number;        // Higher number = higher priority
    timeout: NodeJS.Timeout;
}

export class LeakyBucketService extends EventEmitter {
    private config: LeakyBucketConfig;
    private bucket: QueuedRequest[] = [];
    private currentLevel: number = 0;
    private isProcessing: boolean = false;
    private leakInterval: NodeJS.Timeout | null = null;
    private stats = {
        totalRequests: 0,
        processedRequests: 0,
        rejectedRequests: 0,
        averageWaitTime: 0,
        currentQueueSize: 0,
        peakQueueSize: 0
    };

    constructor(config: LeakyBucketConfig) {
        super();
        this.config = config;
        this.startLeaking();
    }

    /**
     * Add request to leaky bucket queue
     */
    async addRequest<T>(
        requestFn: () => Promise<T>,
        priority: number = 1,
        timeoutMs: number = 30000
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const requestId = this.generateRequestId();
            const timestamp = Date.now();

            this.stats.totalRequests++;
            this.stats.currentQueueSize = this.bucket.length;

            // Check if bucket is full
            if (this.currentLevel >= this.config.capacity) {
                // Allow burst if within burst allowance
                if (this.bucket.length < this.config.burstAllowance) {
                    logger.warn('Leaky bucket burst allowance used', 'LeakyBucket', {
                        currentLevel: this.currentLevel,
                        queueSize: this.bucket.length,
                        burstAllowance: this.config.burstAllowance
                    });
                } else {
                    this.stats.rejectedRequests++;
                    this.emit('requestRejected', { requestId, reason: 'Bucket full' });
                    reject(new Error('Request rejected: Bucket full'));
                    return;
                }
            }

            // Create timeout for request
            const timeout = setTimeout(() => {
                this.removeRequest(requestId);
                this.stats.rejectedRequests++;
                this.emit('requestTimeout', { requestId });
                reject(new Error('Request timeout'));
            }, timeoutMs);

            // Add request to bucket
            const queuedRequest: QueuedRequest = {
                id: requestId,
                timestamp,
                resolve,
                reject,
                priority,
                timeout
            };

            this.bucket.push(queuedRequest);
            this.currentLevel++;

            // Sort by priority (higher priority first)
            this.bucket.sort((a, b) => b.priority - a.priority);

            // Update peak queue size
            this.stats.peakQueueSize = Math.max(this.stats.peakQueueSize, this.bucket.length);

            this.emit('requestQueued', { requestId, queueSize: this.bucket.length });

            // Process request immediately if bucket is not full
            if (this.currentLevel <= this.config.capacity) {
                this.processNextRequest(requestFn);
            }
        });
    }

    /**
     * Process the next request in queue
     */
    private async processNextRequest<T>(requestFn: () => Promise<T>): Promise<void> {
        if (this.bucket.length === 0 || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        const request = this.bucket.shift();

        if (!request) {
            this.isProcessing = false;
            return;
        }

        try {
            const startTime = Date.now();
            const result = await requestFn();
            const processingTime = Date.now() - startTime;

            // Update stats
            this.stats.processedRequests++;
            this.stats.averageWaitTime = this.calculateAverageWaitTime();

            // Clear timeout and resolve
            clearTimeout(request.timeout);
            request.resolve(result);

            this.emit('requestProcessed', {
                requestId: request.id,
                processingTime,
                queueSize: this.bucket.length
            });

        } catch (error: any) {
            // Clear timeout and reject
            clearTimeout(request.timeout);
            request.reject(error);

            this.emit('requestError', {
                requestId: request.id,
                error: error.message,
                queueSize: this.bucket.length
            });
        } finally {
            this.currentLevel = Math.max(0, this.currentLevel - 1);
            this.isProcessing = false;
            this.stats.currentQueueSize = this.bucket.length;
        }
    }

    /**
     * Start the leaky bucket process
     */
    private startLeaking(): void {
        this.leakInterval = setInterval(() => {
            if (this.bucket.length > 0 && !this.isProcessing) {
                // Process requests at leak rate
                const requestsToProcess = Math.min(
                    this.config.leakRate,
                    this.bucket.length
                );

                for (let i = 0; i < requestsToProcess; i++) {
                    if (this.bucket.length > 0) {
                        const request = this.bucket.shift();
                        if (request) {
                            this.processRequest(request);
                        }
                    }
                }

                this.currentLevel = Math.max(0, this.currentLevel - requestsToProcess);
                this.stats.currentQueueSize = this.bucket.length;
            }
        }, 1000); // Check every second
    }

    /**
     * Process a single request from the queue
     */
    private async processRequest(request: QueuedRequest): Promise<void> {
        try {
            // Clear timeout
            clearTimeout(request.timeout);

            request.resolve({ processed: true });

            this.emit('requestProcessed', {
                requestId: request.id,
                queueSize: this.bucket.length
            });
        } catch (error: any) {
            clearTimeout(request.timeout);
            request.reject(error);

            this.emit('requestError', {
                requestId: request.id,
                error: error.message,
                queueSize: this.bucket.length
            });
        }
    }

    /**
     * Remove request from bucket
     */
    private removeRequest(requestId: string): void {
        const index = this.bucket.findIndex(req => req.id === requestId);
        if (index !== -1) {
            const request = this.bucket.splice(index, 1)[0];
            clearTimeout(request.timeout);
            this.currentLevel = Math.max(0, this.currentLevel - 1);
            this.stats.currentQueueSize = this.bucket.length;
        }
    }

    /**
     * Generate unique request ID
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calculate average wait time
     */
    private calculateAverageWaitTime(): number {
        if (this.bucket.length === 0) return 0;

        const now = Date.now();
        const totalWaitTime = this.bucket.reduce((sum, req) => sum + (now - req.timestamp), 0);
        return totalWaitTime / this.bucket.length;
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            currentLevel: this.currentLevel,
            bucketCapacity: this.config.capacity,
            leakRate: this.config.leakRate,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<LeakyBucketConfig>): void {
        this.config = { ...this.config, ...newConfig };
        logger.info('Leaky bucket configuration updated', 'LeakyBucket', this.config);
    }

    /**
     * Clear all queued requests
     */
    clearQueue(): void {
        this.bucket.forEach(request => {
            clearTimeout(request.timeout);
            request.reject(new Error('Queue cleared'));
        });
        this.bucket = [];
        this.currentLevel = 0;
        this.stats.currentQueueSize = 0;
        this.emit('queueCleared');
    }

    /**
     * Shutdown leaky bucket service
     */
    shutdown(): void {
        if (this.leakInterval) {
            clearInterval(this.leakInterval);
            this.leakInterval = null;
        }
        this.clearQueue();
        this.removeAllListeners();
        logger.info('Leaky bucket service shutdown', 'LeakyBucket');
    }
}

// Singleton instance
let leakyBucketInstance: LeakyBucketService | null = null;

export function getLeakyBucketService(): LeakyBucketService {
    if (!leakyBucketInstance) {
        leakyBucketInstance = new LeakyBucketService({
            capacity: 1000,        // Max 1000 requests in bucket
            leakRate: 50,          // Process 50 requests per second
            maxWaitTime: 30000,    // 30 seconds max wait
            burstAllowance: 200    // Allow burst up to 200 requests
        });
    }
    return leakyBucketInstance;
}
