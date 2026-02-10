import * as winston from 'winston';
import * as path from 'path';
import { config } from '../config/environment';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = (): string => {
  const env = config.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : config.LOG_LEVEL;
};

// Define different log formats
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info['timestamp']} ${info['level']}: ${info['message']}`,
  ),
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Logger helper functions
export const logInfo = (message: string, meta?: any): void => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | any): void => {
  if (error instanceof Error) {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
  } else {
    logger.error(message, error);
  }
};

export const logWarn = (message: string, meta?: any): void => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any): void => {
  logger.debug(message, meta);
};

export const logHttp = (message: string, meta?: any): void => {
  logger.http(message, meta);
};

// Request logger middleware helper
export const createRequestLogger = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
      
      if (res.statusCode >= 400) {
        logWarn(message, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
      } else {
        logInfo(message, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }
    });
    
    next();
  };
};

// Database query logger
export const logQuery = (sql: string, duration?: number): void => {
  if (config.NODE_ENV === 'development') {
    logDebug('Database Query', {
      sql,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
};

// Security event logger
export const logSecurityEvent = (event: string, details: any): void => {
  logWarn(`Security Event: ${event}`, {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  });
};

// Performance logger
export const logPerformance = (operation: string, duration: number, details?: any): void => {
  const logLevel = duration > 1000 ? 'warn' : 'info';
  logger[logLevel](`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...details,
  });
};

// Business logic logger
export const logBusinessEvent = (event: string, userId?: string, details?: any): void => {
  logInfo(`Business Event: ${event}`, {
    timestamp: new Date().toISOString(),
    event,
    userId,
    ...details,
  });
};

// Export the main logger and helpers
export { logger, stream };

// Default export
export default logger;
