// Main exports
export { Config } from './Config';
export { getConfig, initializeConfig, getTypedConfig } from './utils';

// Type exports
export * from './types';

// Validation exports
export * from './validation';

// Utility exports
export {
    hasEnv,
    getEnv,
    getRequiredEnv,
    getOptionalEnv,
    getBooleanEnv,
    getNumberEnv,
    getArrayEnv,
    isEnvironment,
    isDevelopment,
    isProduction,
    isStaging,
    getCurrentEnvironment,
    createEnvironmentConfig,
    loadEnvironmentFile,
    validateEnvironment,
    getEnvWithPrefix,
    envToConfig,
    createConfigBuilder,
    ConfigBuilder,
} from './utils';

// Default export
export { Config as default } from './Config';
