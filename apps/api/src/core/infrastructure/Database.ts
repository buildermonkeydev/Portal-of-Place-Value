import Config from '@repo/env-config';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger';

const config = Config.getInstance();

export class Database {
    private static instance: Database;
    private isConnected = false;

    private constructor() { }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async connect(): Promise<void> {
        if (this.isConnected) {
            logger.info('Database already connected');
            return;
        }

        try {
            mongoose.set('strictQuery', false);

            const mongoUri = config.getDatabase().url;
            logger.info(`Database connecting... ${mongoUri}`, 'Database', { mongoUri });

            await mongoose.connect(mongoUri, {
                // Optimized connection pool for high concurrency
                maxPoolSize: 100, // Reduced from 500 to prevent overhead
                minPoolSize: 10,  // Reduced from 50 for faster startup
                maxIdleTimeMS: 10000, // Reduced idle time

                // Faster timeouts
                serverSelectionTimeoutMS: 5000, // Reduced from 10000
                socketTimeoutMS: 15000, // Reduced from 30000
                connectTimeoutMS: 5000, // Reduced from 10000
                heartbeatFrequencyMS: 5000, // Reduced from 10000

                // Connection optimization
                bufferCommands: true, // Enable buffering for better performance
                retryWrites: true,
                retryReads: true,
                maxConnecting: 20, // Reduced from 100

                // Performance optimizations
                zlibCompressionLevel: 1, // Reduced compression for speed
                directConnection: false,
                readPreference: 'primary',

                // Additional optimizations
                waitQueueTimeoutMS: 5000,
            });

            this.isConnected = true;
            logger.info('Database connected successfully');

            setInterval(() => {
                const conn = mongoose.connection;
                logger.debug('Database connection stats', 'Database', {
                    readyState: conn.readyState,
                    host: conn.host,
                    port: conn.port,
                    name: conn.name,
                    collections: Object.keys(conn.collections).length
                });
            }, 60000);

            mongoose.connection.on('error', (error) => {
                logger.error('MongoDB connection error:', error);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
                this.isConnected = false;
            });

            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });

        } catch (error) {
            logger.error('Database connection failed:', "Database", { error });
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.connection.close();
            this.isConnected = false;
            logger.info('Database disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from database:', "Database", { error });
            throw error;
        }
    }

    public getConnectionStatus(): boolean {
        return this.isConnected;
    }
}

export const database = Database.getInstance(); 