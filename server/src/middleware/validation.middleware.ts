import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiResponse } from '../types';

/**
 * Middleware to validate request using express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      data: {
        errors: errors.array().map(error => ({
          field: error.type === 'field' ? (error as any).path : 'unknown',
          message: error.msg,
          value: error.type === 'field' ? (error as any).value : undefined,
        })),
      },
      timestamp: new Date().toISOString(),
    };
    
    res.status(400).json(response);
    return;
  }
  
  next();
};

/**
 * Helper function to create validation middleware
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      data: {
        errors: errors.array().map(error => ({
          field: error.type === 'field' ? (error as any).path : 'unknown',
          message: error.msg,
          value: error.type === 'field' ? (error as any).value : undefined,
        })),
      },
      timestamp: new Date().toISOString(),
    };
    
    res.status(400).json(response);
  };
};

/**
 * Common validation rules
 */
export const commonValidations = {
  uuid: (field: string = 'id') => ({
    field,
    message: `${field} must be a valid UUID`,
  }),
  
  email: {
    field: 'email',
    message: 'Please provide a valid email address',
  },
  
  password: {
    field: 'password',
    message: 'Password must be at least 8 characters long',
  },
  
  required: (field: string) => ({
    field,
    message: `${field} is required`,
  }),
  
  minLength: (field: string, min: number) => ({
    field,
    message: `${field} must be at least ${min} characters long`,
  }),
  
  maxLength: (field: string, max: number) => ({
    field,
    message: `${field} must not exceed ${max} characters`,
  }),
  
  numeric: (field: string) => ({
    field,
    message: `${field} must be a number`,
  }),
  
  positive: (field: string) => ({
    field,
    message: `${field} must be a positive number`,
  }),
  
  date: (field: string) => ({
    field,
    message: `${field} must be a valid date`,
  }),
  
  futureDate: (field: string) => ({
    field,
    message: `${field} must be a future date`,
  }),
  
  pastDate: (field: string) => ({
    field,
    message: `${field} must be a past date`,
  }),
  
  enum: (field: string, values: string[]) => ({
    field,
    message: `${field} must be one of: ${values.join(', ')}`,
  }),
  
  array: (field: string) => ({
    field,
    message: `${field} must be an array`,
  }),
  
  object: (field: string) => ({
    field,
    message: `${field} must be an object`,
  }),
  
  boolean: (field: string) => ({
    field,
    message: `${field} must be a boolean`,
  }),
};

/**
 * Sanitization helpers
 */
export const sanitize = {
  trim: (field: string) => ({
    field,
    message: `${field} will be trimmed`,
  }),
  
  escape: (field: string) => ({
    field,
    message: `${field} will be escaped`,
  }),
  
  normalizeEmail: {
    field: 'email',
    message: 'Email will be normalized',
  },
  
  toLowerCase: (field: string) => ({
    field,
    message: `${field} will be converted to lowercase`,
  }),
  
  toUpperCase: (field: string) => ({
    field,
    message: `${field} will be converted to uppercase`,
  }),
};

/**
 * Custom validation functions
 */
export const customValidations = {
  /**
   * Validate that a date is within a specific range
   */
  dateRange: (minDate?: Date, maxDate?: Date) => {
    return {
      validate: (value: string) => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return false;
        }
        
        if (minDate && date < minDate) {
          return false;
        }
        
        if (maxDate && date > maxDate) {
          return false;
        }
        
        return true;
      },
      message: `Date must be between ${minDate?.toISOString() || 'the beginning of time'} and ${maxDate?.toISOString() || 'now'}`,
    };
  },
  
  /**
   * Validate password strength
   */
  passwordStrength: {
    validate: (password: string) => {
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return passwordRegex.test(password);
    },
    message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  },
  
  /**
   * Validate phone number format
   */
  phoneNumber: {
    validate: (phone: string) => {
      // Basic phone number validation (can be enhanced based on requirements)
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    },
    message: 'Please provide a valid phone number',
  },
  
  /**
   * Validate URL format
   */
  url: {
    validate: (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Please provide a valid URL',
  },
  
  /**
   * Validate file size (in bytes)
   */
  fileSize: (maxSize: number) => {
    return {
      validate: (size: number) => {
        return size <= maxSize;
      },
      message: `File size must not exceed ${maxSize} bytes`,
    };
  },
  
  /**
   * Validate file type
   */
  fileType: (allowedTypes: string[]) => {
    return {
      validate: (mimetype: string) => {
        return allowedTypes.includes(mimetype);
      },
      message: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  },
};

/**
 * Error formatter for validation errors
 */
export const formatValidationErrors = (errors: any[]) => {
  return errors.map(error => ({
    field: error.type === 'field' ? error.path : 'unknown',
    message: error.msg,
    value: error.type === 'field' ? error.value : undefined,
    location: error.location,
  }));
};
