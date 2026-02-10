import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export class SecurityService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = Number(process.env['BCRYPT_SALT_ROUNDS'] || '12');
  }

  /**
   * Hash a password using bcrypt
   */
  public async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a password with its hash
   */
  public async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      logger.error('Error comparing password:', error);
      throw new Error('Failed to compare password');
    }
  }

  /**
   * Generate a random token
   */
  public generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure random string
   */
  public generateSecureRandomString(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const bytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i]! % chars.length];
    }
    
    return result;
  }

  /**
   * Generate a UUID v4
   */
  public generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Create a cryptographic hash of data
   */
  public createHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Create an HMAC hash
   */
  public createHmac(data: string, key: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, key).update(data).digest('hex');
  }

  /**
   * Generate a numeric OTP
   */
  public generateNumericOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * Generate an alphanumeric OTP
   */
  public generateAlphanumericOTP(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      otp += chars[randomIndex];
    }
    
    return otp;
  }

  /**
   * Sanitize input to prevent XSS
   */
  public sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate email format
   */
  public isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  public validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Number check
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    return {
      isValid: errors.length === 0,
      errors,
      score,
    };
  }

  /**
   * Generate a secure session ID
   */
  public generateSessionId(): string {
    return this.generateRandomToken(64);
  }

  /**
   * Encrypt sensitive data (for temporary storage/transit)
   * Note: This is NOT for database storage, use proper encryption for that
   */
  public encryptData(data: string, key: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipherKey = crypto.createHash('sha256').update(key).digest();
      const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  public decryptData(encryptedData: string, key: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      const ivHex = parts[0];
      const encrypted = parts[1];
      if (!encrypted || !ivHex) {
        throw new Error('Invalid encrypted data format');
      }
      const iv = Buffer.from(ivHex, 'hex');
      const cipherKey = crypto.createHash('sha256').update(key).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Rate limit key generator
   */
  public generateRateLimitKey(identifier: string, action: string): string {
    return `${action}:${identifier}`;
  }

  /**
   * Create a fingerprint for request tracking
   */
  public createRequestFingerprint(ip: string, userAgent?: string): string {
    const data = `${ip}:${userAgent || ''}`;
    return this.createHash(data);
  }
}
