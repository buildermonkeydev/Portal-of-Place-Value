import { Config } from './Config';
import { EnvironmentConfig, Environment, ConfigOptions } from './types';

/**
 * Get configuration instance
 */
export function getConfig(options?: ConfigOptions): Config {
    return Config.getInstance(options);
}

/**
 * Initialize configuration
 */
export function initializeConfig(options?: ConfigOptions): Config {
    return Config.initialize(options);
}

/**
 * Get configuration with type safety
 */
export function getTypedConfig<T extends keyof EnvironmentConfig>(
    section: T,
    options?: ConfigOptions
): EnvironmentConfig[T] {
    const config = getConfig(options);
    return config.getConfig()[section];
}

/**
 * Check if environment variable is set
 */
export function hasEnv(key: string): boolean {
    return process.env[key] !== undefined;
}

/**
 * Get environment variable with type conversion
 */
export function getEnv<T = string>(
    key: string,
    defaultValue?: T,
    type: 'string' | 'number' | 'boolean' | 'array' = 'string'
): T {
    const value = process.env[key];

    if (value === undefined || value === '') {
        if (defaultValue === undefined) {
            throw new Error(`Environment variable ${key} is required but not set`);
        }
        return defaultValue;
    }

    switch (type) {
        case 'number':
            const num = parseInt(value, 10);

            if (isNaN(num)) {
                console.log(`Environment variable ${key}-is${key} must be a number, got: ${value}`)
                throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
            }
            return num as T;

        case 'boolean':
            return (value.toLowerCase() === 'true' || value === '1') as T;

        case 'array':
            return value.split(',').map(item => item.trim()).filter(Boolean) as T;

        default:
            return value as T;
    }
}

/**
 * Get required environment variable
 */
export function getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
}

/**
 * Get optional environment variable
 */
export function getOptionalEnv(key: string, defaultValue: string = ''): string {
    return process.env[key] || defaultValue;
}

/**
 * Get boolean environment variable
 */
export function getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get number environment variable
 */
export function getNumberEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get array environment variable (comma-separated)
 */
export function getArrayEnv(key: string, defaultValue: string[] = []): string[] {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Check if running in specific environment
 */
export function isEnvironment(env: Environment): boolean {
    return process.env.NODE_ENV === env;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
    return isEnvironment('development');
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
    return isEnvironment('production');
}

/**
 * Check if running in staging
 */
export function isStaging(): boolean {
    return isEnvironment('staging');
}

/**
 * Get current environment
 */
export function getCurrentEnvironment(): Environment {
    const env = process.env.NODE_ENV;
    if (env === 'production' || env === 'staging') {
        return env;
    }
    return 'development';
}

/**
 * Create environment-specific configuration
 */
export function createEnvironmentConfig(env: Environment): Partial<ConfigOptions> {
    const baseOptions: Partial<ConfigOptions> = {
        environment: env,
        validateOnLoad: true,
        strictMode: true,
    };

    switch (env) {
        case 'development':
            return {
                ...baseOptions,
                configPath: '.env.development',
            };

        case 'staging':
            return {
                ...baseOptions,
                configPath: '.env.staging',
            };

        case 'production':
            return {
                ...baseOptions,
                configPath: '.env.production',
                strictMode: true,
            };

        default:
            return baseOptions;
    }
}

/**
 * Load environment from file
 */
export function loadEnvironmentFile(filePath: string): void {
    try {
        require('dotenv').config({ path: filePath });
    } catch (error) {
        throw new Error(`Failed to load environment file: ${filePath}`);
    }
}

/**
 * Validate environment variables
 */
export function validateEnvironment(requiredVars: string[]): void {
    const missing = requiredVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

/**
 * Get all environment variables with prefix
 */
export function getEnvWithPrefix(prefix: string): Record<string, string> {
    const env: Record<string, string> = {};

    for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith(prefix)) {
            env[key] = value || '';
        }
    }

    return env;
}

/**
 * Convert environment variables to configuration object
 */
export function envToConfig<T extends Record<string, any>>(
    mapping: Record<keyof T, string>,
    defaults: Partial<T> = {}
): T {
    const config = { ...defaults } as T;

    for (const [configKey, envKey] of Object.entries(mapping)) {
        if (process.env[envKey] !== undefined) {
            (config as any)[configKey] = process.env[envKey];
        }
    }

    return config;
}

/**
 * Create configuration builder
 */
export class ConfigBuilder {
    private config: Partial<EnvironmentConfig> = {};
    private options: ConfigOptions = {};

    public setEnvironment(env: Environment): this {
        this.options.environment = env;
        return this;
    }

    public setConfigPath(path: string): this {
        this.options.configPath = path;
        return this;
    }

    public setValidation(enabled: boolean): this {
        this.options.validateOnLoad = enabled;
        return this;
    }

    public setStrictMode(enabled: boolean): this {
        this.options.strictMode = enabled;
        return this;
    }

    public build(): Config {
        return Config.initialize(this.options);
    }
}

/**
 * Create configuration builder instance
 */
export function createConfigBuilder(): ConfigBuilder {
    return new ConfigBuilder();
}
