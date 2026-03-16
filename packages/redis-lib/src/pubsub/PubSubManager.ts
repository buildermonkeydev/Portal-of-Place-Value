import { RedisClient } from '../client/RedisClient';
import logger from '@repo/logger';

export interface MessageHandler<T = any> {
    (channel: string, message: T): void | Promise<void>;
}

export interface SubscriptionOptions {
    pattern?: boolean;
    count?: number;
}

export interface PubSubStats {
    totalSubscriptions: number;
    activeChannels: number;
    messagesPublished: number;
    messagesReceived: number;
    errors: number;
}

export class PubSubManager {
    private redisClient: RedisClient;
    private publisher: any;
    private subscriber: any;
    private handlers: Map<string, MessageHandler[]> = new Map();
    private patternHandlers: Map<string, MessageHandler[]> = new Map();
    private stats: PubSubStats;
    private isConnected: boolean = false;

    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
        this.stats = {
            totalSubscriptions: 0,
            activeChannels: 0,
            messagesPublished: 0,
            messagesReceived: 0,
            errors: 0
        };
    }

    /**
     * Initialize pub/sub clients
     */
    public async initialize(): Promise<void> {
        try {
            // Create separate clients for pub/sub
            this.publisher = this.redisClient.getClient();
            this.subscriber = this.redisClient.getClient();

            if (!this.publisher || !this.subscriber) {
                throw new Error('Redis client not available');
            }

            // Setup message handler
            this.subscriber.on('message', this.handleMessage.bind(this));
            this.subscriber.on('pmessage', this.handlePatternMessage.bind(this));

            this.isConnected = true;
            logger.info('PubSub manager initialized', 'PubSubManager');
        } catch (error) {
            logger.error('Failed to initialize PubSub manager', 'PubSubManager', { error });
            throw error;
        }
    }

    /**
     * Publish message to channel
     */
    public async publish<T = any>(channel: string, message: T): Promise<number> {
        try {
            if (!this.publisher) {
                throw new Error('Publisher not initialized');
            }

            const serializedMessage = JSON.stringify(message);
            const subscriberCount = await this.publisher.publish(channel, serializedMessage);

            this.stats.messagesPublished++;
            logger.info(`Message published to channel: ${channel}`, 'PubSubManager', {
                subscribers: subscriberCount,
                messageSize: serializedMessage.length
            });

            return subscriberCount;
        } catch (error) {
            this.stats.errors++;
            logger.error(`Failed to publish message to channel: ${channel}`, 'PubSubManager', { error });
            throw error;
        }
    }

    /**
     * Subscribe to channel
     */
    public async subscribe<T = any>(
        channel: string,
        handler: MessageHandler<T>,
        options: SubscriptionOptions = {}
    ): Promise<void> {
        try {
            if (!this.subscriber) {
                throw new Error('Subscriber not initialized');
            }

            if (options.pattern) {
                // Pattern subscription
                if (!this.patternHandlers.has(channel)) {
                    this.patternHandlers.set(channel, []);
                    await this.subscriber.psubscribe(channel);
                    this.stats.activeChannels++;
                }
                this.patternHandlers.get(channel)!.push(handler as MessageHandler);
            } else {
                // Exact channel subscription
                if (!this.handlers.has(channel)) {
                    this.handlers.set(channel, []);
                    await this.subscriber.subscribe(channel);
                    this.stats.activeChannels++;
                }
                this.handlers.get(channel)!.push(handler as MessageHandler);
            }

            this.stats.totalSubscriptions++;
            logger.info(`Subscribed to channel: ${channel}`, 'PubSubManager', {
                pattern: options.pattern,
                totalHandlers: this.getHandlerCount(channel, options.pattern || false)
            });
        } catch (error) {
            this.stats.errors++;
            logger.error(`Failed to subscribe to channel: ${channel}`, 'PubSubManager', { error });
            throw error;
        }
    }

    /**
     * Unsubscribe from channel
     */
    public async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
        try {
            if (!this.subscriber) {
                throw new Error('Subscriber not initialized');
            }

            // Try exact channel first
            if (this.handlers.has(channel)) {
                const handlers = this.handlers.get(channel)!;

                if (handler) {
                    const index = handlers.indexOf(handler);
                    if (index > -1) {
                        handlers.splice(index, 1);
                    }
                } else {
                    handlers.length = 0;
                }

                if (handlers.length === 0) {
                    this.handlers.delete(channel);
                    await this.subscriber.unsubscribe(channel);
                    this.stats.activeChannels--;
                }
            }

            // Try pattern channel
            if (this.patternHandlers.has(channel)) {
                const handlers = this.patternHandlers.get(channel)!;

                if (handler) {
                    const index = handlers.indexOf(handler);
                    if (index > -1) {
                        handlers.splice(index, 1);
                    }
                } else {
                    handlers.length = 0;
                }

                if (handlers.length === 0) {
                    this.patternHandlers.delete(channel);
                    await this.subscriber.punsubscribe(channel);
                    this.stats.activeChannels--;
                }
            }

            logger.info(`Unsubscribed from channel: ${channel}`, 'PubSubManager');
        } catch (error) {
            this.stats.errors++;
            logger.error(`Failed to unsubscribe from channel: ${channel}`, 'PubSubManager', { error });
            throw error;
        }
    }

    /**
     * Publish to multiple channels
     */
    public async publishToChannels<T = any>(
        channels: string[],
        message: T
    ): Promise<{ [channel: string]: number }> {
        const results: { [channel: string]: number } = {};

        for (const channel of channels) {
            try {
                results[channel] = await this.publish(channel, message);
            } catch (error) {
                results[channel] = 0;
                logger.error(`Failed to publish to channel: ${channel}`, 'PubSubManager', { error });
            }
        }

        return results;
    }

    /**
     * Get active channels
     */
    public getActiveChannels(): string[] {
        return [...this.handlers.keys(), ...this.patternHandlers.keys()];
    }

    /**
     * Get subscription count for channel
     */
    public getSubscriptionCount(channel: string): number {
        return this.getHandlerCount(channel, false) + this.getHandlerCount(channel, true);
    }

    /**
     * Get statistics
     */
    public getStats(): PubSubStats {
        return { ...this.stats };
    }

    /**
     * Reset statistics
     */
    public resetStats(): void {
        this.stats = {
            totalSubscriptions: 0,
            activeChannels: 0,
            messagesPublished: 0,
            messagesReceived: 0,
            errors: 0
        };
    }

    /**
     * Close pub/sub connections
     */
    public async close(): Promise<void> {
        try {
            if (this.subscriber) {
                await this.subscriber.quit();
            }
            if (this.publisher && this.publisher !== this.redisClient.getClient()) {
                await this.publisher.quit();
            }

            this.handlers.clear();
            this.patternHandlers.clear();
            this.isConnected = false;

            logger.info('PubSub manager closed', 'PubSubManager');
        } catch (error) {
            logger.error('Failed to close PubSub manager', 'PubSubManager', { error });
            throw error;
        }
    }

    /**
     * Handle incoming messages
     */
    private async handleMessage(channel: string, message: string): Promise<void> {
        try {
            const handlers = this.handlers.get(channel);
            if (!handlers || handlers.length === 0) {
                return;
            }

            const parsedMessage = this.parseMessage(message);

            // Call all handlers for this channel
            for (const handler of handlers) {
                try {
                    await handler(channel, parsedMessage);
                } catch (error) {
                    this.stats.errors++;
                    logger.error(`Handler error for channel: ${channel}`, 'PubSubManager', { error });
                }
            }

            this.stats.messagesReceived++;
        } catch (error) {
            this.stats.errors++;
            logger.error(`Failed to handle message for channel: ${channel}`, 'PubSubManager', { error });
        }
    }

    /**
     * Handle incoming pattern messages
     */
    private async handlePatternMessage(pattern: string, channel: string, message: string): Promise<void> {
        try {
            const handlers = this.patternHandlers.get(pattern);
            if (!handlers || handlers.length === 0) {
                return;
            }

            const parsedMessage = this.parseMessage(message);

            // Call all handlers for this pattern
            for (const handler of handlers) {
                try {
                    await handler(channel, parsedMessage);
                } catch (error) {
                    this.stats.errors++;
                    logger.error(`Pattern handler error for pattern: ${pattern}, channel: ${channel}`, 'PubSubManager', { error });
                }
            }

            this.stats.messagesReceived++;
        } catch (error) {
            this.stats.errors++;
            logger.error(`Failed to handle pattern message for pattern: ${pattern}, channel: ${channel}`, 'PubSubManager', { error });
        }
    }

    /**
     * Parse message from string
     */
    private parseMessage(message: string): any {
        try {
            return JSON.parse(message);
        } catch {
            return message; // Return as string if not JSON
        }
    }

    /**
     * Get handler count for channel
     */
    private getHandlerCount(channel: string, pattern: boolean): number {
        if (pattern) {
            return this.patternHandlers.get(channel)?.length || 0;
        } else {
            return this.handlers.get(channel)?.length || 0;
        }
    }
}
