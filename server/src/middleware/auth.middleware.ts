import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logSecurityEvent, logError } from '../utils/logger';
import { UserRole } from '../types';
import { JwtService } from '../services/jwt.service';

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
        factoryId?: string;
      } & Record<string, any>;
    }
  }
}


// Authentication middleware (alias for authenticateToken)
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logSecurityEvent('Authentication failed - No token provided', {
        ip: req.ip || '',
        userAgent: req.get('User-Agent') || '',
        url: req.originalUrl,
        method: req.method,
      });

      res.status(401).json({
        success: false,
        message: 'Access token is required',
        code: 'TOKEN_REQUIRED',
      });
      return;
    }

    // Verify JWT token using JwtService
    const jwtService = new JwtService();
    const decoded = jwtService.verifyAccessToken(token);

    if (!decoded) {
      logSecurityEvent('Authentication failed - Invalid token', {
        ip: req.ip || '',
        userAgent: req.get('User-Agent') || '',
        url: req.originalUrl,
        method: req.method,
      });

      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    // Attach user information to request object
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        ['factoryId']: decoded['factoryId'],
      };

    next();
  } catch (error) {
    let errorMessage = 'Invalid or expired token';
    let errorCode = 'TOKEN_INVALID';

    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Token has expired';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid token format';
      errorCode = 'TOKEN_MALFORMED';
    }

    logSecurityEvent('Authentication failed - Invalid token', {
      ip: req.ip || '',
      userAgent: req.get('User-Agent') || '',
      url: req.originalUrl,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(401).json({
      success: false,
      message: errorMessage,
      code: errorCode,
    });
  }
};

// Role-based authorization middleware (alias for authorizeRoles)
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

  if (!allowedRoles.includes(req.user['role'] as UserRole)) {
      logSecurityEvent('Authorization failed - Insufficient permissions', {
        ip: req.ip || '',
        userAgent: req.get('User-Agent') || '',
        url: req.originalUrl,
        method: req.method,
        userId: req.user['id'],
        userRole: req.user['role'],
        requiredRoles: allowedRoles,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        currentRole: req.user['role'],
      });
      return;
    }

    next();
  };
};

// Factory access authorization middleware
export const authorizeFactoryAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    // Super admins can access any factory
    if (req.user['role'] === 'Super Admin') {
      next();
      return;
    }

    // For other roles, check if they have access to the requested factory
    const requestedFactoryId = req.params['factoryId'] || req.body['factoryId'] || req.query['factoryId'] as string;

    if (!requestedFactoryId) {
      res.status(400).json({
        success: false,
        message: 'Factory ID is required',
        code: 'FACTORY_ID_REQUIRED',
      });
      return;
    }

    const userFactoryId = req.user['factoryId'];
    if (userFactoryId && userFactoryId !== requestedFactoryId) {
      logSecurityEvent('Authorization failed - Factory access denied', {
        ip: req.ip || '',
        userAgent: req.get('User-Agent') || '',
        url: req.originalUrl,
        method: req.method,
        userId: req.user['id'],
        userRole: req.user['role'],
        userFactoryId: userFactoryId || '',
        requestedFactoryId,
      });

      res.status(403).json({
        success: false,
        message: 'Access to this factory is not permitted',
        code: 'FACTORY_ACCESS_DENIED',
      });
      return;
    }

    next();
  } catch (error) {
    logSecurityEvent('Authorization error - Factory access check failed', {
      ip: req.ip || '',
      userAgent: req.get('User-Agent') || '',
      url: req.originalUrl,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      code: 'AUTHORIZATION_ERROR',
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuthentication = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const jwtService = new JwtService();
      const decoded = jwtService.verifyAccessToken(token);
      
      if (decoded) {
        req.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
          ['factoryId']: decoded['factoryId'],
        };
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    next();
  }
};

// Rate limiting middleware helper
export const createRateLimitMiddleware = (windowMs: number, max: number, message?: string) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || '';
    const now = Date.now();

    // Clean up old entries
    for (const [ip, data] of Array.from(requests.entries())) {
      if (data.resetTime < now) {
        requests.delete(ip);
      }
    }

    const requestData = requests.get(key);

    if (!requestData || requestData.resetTime < now) {
      // New window
      requests.set(key, { count: 1, resetTime: now + windowMs });
      next();
    } else if (requestData.count < max) {
      // Within limit
      requestData.count++;
      next();
    } else {
      // Rate limit exceeded
      logSecurityEvent('Rate limit exceeded', {
        ip: req.ip || '',
        userAgent: req.get('User-Agent') || '',
        url: req.originalUrl,
        method: req.method,
        count: requestData.count,
        max,
        windowMs,
      });

      res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
      });
    }
  };
};

// CORS middleware helper
export const corsMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  const allowedOrigins = config.CORS_ORIGIN.split(',');

  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    _res.header('Access-Control-Allow-Origin', origin || '*');
  }

  _res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  _res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  _res.header('Access-Control-Allow-Credentials', 'true');
  _res.header('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    _res.sendStatus(200);
  } else {
    next();
  }
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);

    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }

    next();
  };
};

// Error handling middleware
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logError('Unhandled error', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack }),
  });
};

// 404 handler middleware
export const notFoundHandler = (_req: Request, _res: Response, _next: NextFunction): void => {
  _res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
  });
};
