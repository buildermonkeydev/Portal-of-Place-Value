// Environment types
export interface Environment {
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    LOG_LEVEL: string;
    LOG_FILE_PATH: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    CORS_ORIGIN: string;
    MAX_FILE_SIZE: number;
    UPLOAD_PATH: string;
} 