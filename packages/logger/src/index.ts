import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  maxSize: string;
  maxFiles: string;
  datePattern: string;
}

class Logger {
  private logger: winston.Logger;
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      logDir: './logs',
      maxSize: '10m',
      maxFiles: '5d',
      datePattern: 'YYYY-MM-DD',
      ...config
    };

    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const contextStr = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level}: ${contextStr} ${message}${metaStr}`;
            })
          )
        })
      );
    }

    if (this.config.enableFile) {
      transports.push(
        new DailyRotateFile({
          filename: path.join(this.config.logDir, 'general', 'app-%DATE%.log'),
          datePattern: this.config.datePattern,
          maxSize: this.config.maxSize,
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      transports.push(
        new DailyRotateFile({
          filename: path.join(this.config.logDir, 'error', 'error-%DATE%.log'),
          datePattern: this.config.datePattern,
          maxSize: this.config.maxSize,
          maxFiles: this.config.maxFiles,
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      transports.push(
        new DailyRotateFile({
          filename: path.join(this.config.logDir, 'database', 'database-%DATE%.log'),
          datePattern: this.config.datePattern,
          maxSize: this.config.maxSize,
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.label({ label: 'DATABASE' })
          )
        })
      );

      // Session logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(this.config.logDir, 'session', 'session-%DATE%.log'),
          datePattern: this.config.datePattern,
          maxSize: this.config.maxSize,
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.label({ label: 'SESSION' })
          )
        })
      );

      // API logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(this.config.logDir, 'api', 'api-%DATE%.log'),
          datePattern: this.config.datePattern,
          maxSize: this.config.maxSize,
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.label({ label: 'API' })
          )
        })
      );

      transports.push(
        new DailyRotateFile({
          filename: path.join(this.config.logDir, 'auth', 'auth-%DATE%.log'),
          datePattern: this.config.datePattern,
          maxSize: this.config.maxSize,
          maxFiles: this.config.maxFiles,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format.label({ label: 'AUTH' })
          )
        })
      );
    }

    return winston.createLogger({
      level: this.config.level,
      transports,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      exitOnError: false
    });
  }

  private log(level: LogLevel, message: any, context?: string, meta?: any): void {
    const logData: any = {
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      context
    };

    if (meta) {
      Object.assign(logData, meta);
    }

    this.logger.log(level, logData);
  }

  public debug(message: any, context?: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, context, meta);
  }

  public info(message: any, context?: string, meta?: any): void {
    this.log(LogLevel.INFO, message, context, meta);
  }

  public warn(message: any, context?: string, meta?: any): void {
    this.log(LogLevel.WARN, message, context, meta);
  }

  public error(message: any, context?: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, context, meta);
  }

  public database(message: any, context?: string, meta?: any): void {
    this.info(message, context, { ...meta, category: 'database' });
  }

  public session(message: any, context?: string, meta?: any): void {
    this.info(message, context, { ...meta, category: 'session' });
  }

  public api(message: any, context?: string, meta?: any): void {
    this.info(message, context, { ...meta, category: 'api' });
  }

  public auth(message: any, context?: string, meta?: any): void {
    this.info(message, context, { ...meta, category: 'auth' });
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
    this.logger.level = level;
  }

  public setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger = this.createLogger();
  }

  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  public getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  public stream = {
    write: (message: string) => {
      this.info(message.trim(), 'HTTP');
    }
  };
}

const defaultLogger = new Logger();

export const debug = defaultLogger.debug.bind(defaultLogger);
export const info = defaultLogger.info.bind(defaultLogger);
export const warn = defaultLogger.warn.bind(defaultLogger);
export const error = defaultLogger.error.bind(defaultLogger);
export const database = defaultLogger.database.bind(defaultLogger);
export const session = defaultLogger.session.bind(defaultLogger);
export const api = defaultLogger.api.bind(defaultLogger);
export const auth = defaultLogger.auth.bind(defaultLogger);

export { Logger, LogLevel };
export default defaultLogger;