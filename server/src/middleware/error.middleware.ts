import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse, AppError } from '@/types';

/**
 * Custom error class for application errors
 */
export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

/**
 * Async error wrapper to catch async errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error = { ...err } as AppError;
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'],
    userId: (req as any).user?.userId
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_SERVER_ERROR';

  // Handle custom application errors
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APPLICATION_ERROR';
  }
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }
  // Handle JWT expired errors
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Handle database errors
  else if (err.name === 'DatabaseError') {
    statusCode = 503;
    message = 'Database error';
    code = 'DATABASE_ERROR';
  }
  // Handle syntax errors
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON';
    code = 'INVALID_JSON';
  }
  // Handle cast errors (MongoDB/Mongoose style)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  }
  // Handle duplicate key errors
  else if (err.name === 'DuplicateKeyError' || (err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    code = 'DUPLICATE_ENTRY';
  }

  const response: ApiResponse = {
    success: false,
    message,
    error: error.message,
    timestamp: new Date().toISOString()
  };

  // Add error code if available
  if (code) {
    (response as any).code = code;
  }

  // Add error details in development
  if (process.env['NODE_ENV'] === 'development') {
    (response as any).stack = error.stack;
    if (error.details) {
      (response as any).details = error.details;
    }
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found middleware
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new CustomError(
    `Route ${req.originalUrl} not found`,
    404,
    true,
    'ROUTE_NOT_FOUND'
  );

  next(error);
};

/**
 * Request validation middleware
 */
export const validateRequest = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const validationError = new CustomError(
        'Validation failed',
        400,
        true,
        'VALIDATION_ERROR',
        error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      );
      return next(validationError);
    }

    next();
  };
};

/**
 * Rate limit exceeded error
 */
export const rateLimitExceeded = (req: Request, res: Response, _next: NextFunction): void => {
  const error = new CustomError(
    'Too many requests, please try again later',
    429,
    true,
    'RATE_LIMIT_EXCEEDED'
  );

  errorHandler(error, req, res, _next);
};

/**
 * Unauthorized access error
 */
export const unauthorized = (message: string = 'Unauthorized access'): CustomError => {
  return new CustomError(message, 401, true, 'UNAUTHORIZED');
};

/**
 * Forbidden access error
 */
export const forbidden = (message: string = 'Forbidden access'): CustomError => {
  return new CustomError(message, 403, true, 'FORBIDDEN');
};

/**
 * Not found error
 */
export const notFound = (message: string = 'Resource not found'): CustomError => {
  return new CustomError(message, 404, true, 'NOT_FOUND');
};

/**
 * Bad request error
 */
export const badRequest = (message: string = 'Bad request', details?: any): CustomError => {
  return new CustomError(message, 400, true, 'BAD_REQUEST', details);
};

/**
 * Conflict error
 */
export const conflict = (message: string = 'Conflict'): CustomError => {
  return new CustomError(message, 409, true, 'CONFLICT');
};

/**
 * Unprocessable entity error
 */
export const unprocessableEntity = (message: string = 'Unprocessable entity', details?: any): CustomError => {
  return new CustomError(message, 422, true, 'UNPROCESSABLE_ENTITY', details);
};
