import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { config } from '@/config/environment';

/**
 * Security utility functions for the PIC application
 */

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Token generation
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateNumericOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};

// Session management
export const generateSessionId = (): string => {
  return generateSecureToken(64);
};

export const generateCsrfToken = (): string => {
  return generateSecureToken(32);
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

export const sanitizeUsername = (username: string): string => {
  if (!username) return '';
  
  // Allow only alphanumeric characters, underscores, and hyphens
  return username.trim().replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
};

// SQL injection prevention
export const escapeSqlLike = (value: string): string => {
  if (!value) return '';
  
  return value
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\\/g, '\\\\');
};

// Rate limiting helpers
export const generateRateLimitKey = (identifier: string, action: string): string => {
  return `rate_limit:${action}:${identifier}`;
};

// File upload security
export const generateSecureFileName = (originalName: string): string => {
  const ext = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = generateSecureToken(8);
  
  return `${timestamp}_${random}.${ext || 'bin'}`;
};

export const isAllowedFileType = (filename: string, allowedTypes: string[]): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedTypes.includes(ext) : false;
};

// API key generation
export const generateApiKey = (): string => {
  const prefix = 'pic_';
  const key = generateSecureToken(32);
  return `${prefix}${key}`;
};

// Encryption utilities (for sensitive data)
export const encryptSensitiveData = (data: string): string => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(config.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

export const decryptSensitiveData = (encryptedData: string): string => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(config.ENCRYPTION_KEY || 'default-key', 'salt', 32);
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted data format');
  
  const iv = Buffer.from(parts[0] || '', 'hex');
  const authTag = Buffer.from(parts[1] || '', 'hex');
  const encrypted = parts[2] || '';
  
  const decipher = crypto.createDecipher(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Validation helpers
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  
  if (username.length > 20) {
    errors.push('Username must be no more than 20 characters long');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Security headers
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
};

// IP address utilities
export const getClientIP = (req: any): string => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection as any)?.socket?.remoteAddress ||
         '127.0.0.1';
};

export const isPrivateIP = (ip: string): boolean => {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/
  ];
  
  return privateRanges.some(range => range.test(ip));
};

// Audit logging helpers
export const createAuditLog = (
  userId: string,
  action: string,
  resource: string,
  details?: any,
  ip?: string,
  userAgent?: string
) => {
  return {
    userId,
    action,
    resource,
    details,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    sessionId: generateSessionId()
  };
};

// Token blacklist management (for logout functionality)
class TokenBlacklist {
  private blacklistedTokens = new Set<string>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);
  }

  add(token: string, expiryTime?: number): void {
    this.blacklistedTokens.add(token);
    
    if (expiryTime) {
      setTimeout(() => {
        this.blacklistedTokens.delete(token);
      }, expiryTime - Date.now());
    }
  }

  isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token);
  }

  private cleanup(): void {
    // This would need to be enhanced to check actual token expiry
    // For now, just clear old entries periodically
    if (this.blacklistedTokens.size > 10000) {
      this.blacklistedTokens.clear();
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const tokenBlacklist = new TokenBlacklist();

// Data masking utilities
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  if (!username) return email;
  
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
  
  return `${maskedUsername}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  
  const last4 = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4) + last4;
  
  return masked;
};

export const maskCreditCard = (cardNumber: string): string => {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  
  const last4 = cardNumber.slice(-4);
  const masked = '*'.repeat(cardNumber.length - 4) + last4;
  
  return masked;
};
