import { describe, it, jest, expect, beforeEach } from "@jest/globals";

const mockLogger = {
    redis: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    session: jest.fn(),
    default: {
        redis: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        session: jest.fn(),
    }
};

// Mock the logger module
jest.mock('@repo/logger', () => mockLogger);

// Global test timeout
