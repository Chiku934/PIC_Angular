import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface JwtPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  factoryId?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export class JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly resetTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly resetTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env['JWT_ACCESS_SECRET'] || 'your-access-secret-key';
    this.refreshTokenSecret = process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret-key';
    this.resetTokenSecret = process.env['JWT_RESET_SECRET'] || 'your-reset-secret-key';
    this.accessTokenExpiry = process.env['JWT_ACCESS_EXPIRY'] || '15m';
    this.refreshTokenExpiry = process.env['JWT_REFRESH_EXPIRY'] || '7d';
    this.resetTokenExpiry = process.env['JWT_RESET_EXPIRY'] || '1h';

    if (
      this.accessTokenSecret === 'your-access-secret-key' ||
      this.refreshTokenSecret === 'your-refresh-secret-key' ||
      this.resetTokenSecret === 'your-reset-secret-key'
    ) {
      logger.warn('Using default JWT secrets. Please set JWT_SECRET_* environment variables in production.');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  public generateTokens(payload: JwtPayload): Tokens {
    try {
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = this.generateRefreshToken(payload);

      return { accessToken, refreshToken };
    } catch (error) {
      logger.error('Failed to generate tokens:', error);
      throw new Error('Token generation failed');
    }
  }

  /**
   * Generate access token
   */
  public generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'pic-certificates-api',
      audience: 'pic-certificates-client',
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'pic-certificates-api',
      audience: 'pic-certificates-client',
    } as jwt.SignOptions);
  }

  /**
   * Generate reset token
   */
  public generateResetToken(userId: number): string {
    return jwt.sign(
      { id: userId, type: 'reset' },
      this.resetTokenSecret,
      {
        expiresIn: this.resetTokenExpiry,
        issuer: 'pic-certificates-api',
        audience: 'pic-certificates-client',
      } as jwt.SignOptions
    );
  }

  /**
   * Verify access token
   */
  public verifyAccessToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'pic-certificates-api',
        audience: 'pic-certificates-client',
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      logger.warn('Invalid access token:', error);
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'pic-certificates-api',
        audience: 'pic-certificates-client',
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      logger.warn('Invalid refresh token:', error);
      return null;
    }
  }

  /**
   * Verify reset token
   */
  public verifyResetToken(token: string): { id: number; type: string } | null {
    try {
      const decoded = jwt.verify(token, this.resetTokenSecret, {
        issuer: 'pic-certificates-api',
        audience: 'pic-certificates-client',
      }) as { id: number; type: string };

      if (decoded.type !== 'reset') {
        logger.warn('Invalid token type for reset:', decoded.type);
        return null;
      }

      return decoded;
    } catch (error) {
      logger.warn('Invalid reset token:', error);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  public extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1] || null;
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      logger.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  public isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      logger.error('Failed to check token expiration:', error);
      return true;
    }
  }
}
