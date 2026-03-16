import { describe, it, expect } from "@jest/globals";
import logger, { Logger, LogLevel } from "..";

describe("@repo/logger", () => {
  it("should have all required methods", () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.database).toBe('function');
    expect(typeof logger.session).toBe('function');
    expect(typeof logger.api).toBe('function');
  });

  it("should have configuration methods", () => {
    expect(typeof logger.setLevel).toBe('function');
    expect(typeof logger.setConfig).toBe('function');
    expect(typeof logger.getConfig).toBe('function');
    expect(typeof logger.getWinstonLogger).toBe('function');
  });

  it("should have stream interface", () => {
    expect(typeof logger.stream).toBe('object');
    expect(typeof logger.stream.write).toBe('function');
  });

  it("should create custom logger instance", () => {
    const customLogger = new Logger({
      level: LogLevel.DEBUG,
      enableConsole: false,
      enableFile: false
    });

    expect(customLogger).toBeInstanceOf(Logger);
    expect(typeof customLogger.info).toBe('function');
  });

  it("should handle different log levels", () => {
    // These should not throw errors
    expect(() => {
      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");
    }).not.toThrow();
  });

  it("should handle context and metadata", () => {
    // These should not throw errors
    expect(() => {
      logger.info("test message", "TestContext");
      logger.info("test message", "TestContext", { userId: 123 });
      logger.database("database message", "DatabaseService");
      logger.session("session message", "SessionManager");
      logger.api("api message", "APIController");
    }).not.toThrow();
  });
});