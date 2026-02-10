import { Request, Response } from 'express';
import { logger } from '@/utils/logger';
import { JwtService } from '@/services/jwt.service';
import { UserModel } from '@/models/User';
import { SecurityService } from '@/services/security.service';

export class AuthController {
  private jwtService: JwtService;
  private securityService: SecurityService;

  constructor() {
    this.jwtService = new JwtService();
    this.securityService = new SecurityService();
  }

  /**
   * Login user
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      // Find user by email (username field contains email)
      const user = await UserModel.findByUsername(username);
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Verify password against database
      const isPasswordValid = await UserModel.verifyPassword(username, password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      // Generate tokens
      const tokens = this.jwtService.generateTokens({
        id: user.id,
        username: user.email, // Use email as username
        email: user.email,
        role: user.role,
      });

      // Log successful login
      logger.info(`User ${username} logged in successfully`, {
        userId: user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Format response to match client expectations
      res.status(200).json({
        success: true,
        message: 'Login successful',
        access_token: tokens.accessToken, // Client expects access_token field
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          displayName: `${user.firstName} ${user.lastName}`.trim() || user.email,
        },
        tokens, // Keep tokens for future use
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Logout user
   */
  public logout = async (_req: Request, res: Response): Promise<void> => {
    try {
      // In a real implementation, you'd invalidate the refresh token
      // For now, we'll just return a success message
      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Refresh access token
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = this.jwtService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
        return;
      }

      // Find user
      const user = await UserModel.findById(decoded.id);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
        return;
      }

      // Generate new tokens
      const tokens = this.jwtService.generateTokens({
        id: user.id,
        username: user.email, // Use email as username
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Change password
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Find user
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Verify current password (in a real implementation)
      const isCurrentPasswordValid = await this.securityService.comparePassword(
        currentPassword,
        'hashed_password_here'
      );
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
        return;
      }

      // Hash new password
      const newPasswordHash = await this.securityService.hashPassword(newPassword);

      // Update password
      const updated = await UserModel.updatePassword(userId, newPasswordHash);
      if (!updated) {
        res.status(500).json({
          success: false,
          message: 'Failed to update password',
        });
        return;
      }

      logger.info(`Password changed for user ${user.username}`, {
        userId: user.id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Forgot password
   */
  public forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal that the user doesn't exist
        res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent',
        });
        return;
      }

      // Generate reset token (in a real implementation)
      this.jwtService.generateResetToken(user.id);

      // Send reset email (in a real implementation)
      logger.info(`Password reset requested for user ${user.username}`, {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Reset password
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;

      // Verify reset token
      const decoded = this.jwtService.verifyResetToken(token);
      if (!decoded) {
        res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
        return;
      }

      // Find user
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Hash new password
      const passwordHash = await this.securityService.hashPassword(password);

      // Update password
      const updated = await UserModel.updatePassword(user.id, passwordHash);
      if (!updated) {
        res.status(500).json({
          success: false,
          message: 'Failed to reset password',
        });
        return;
      }

      logger.info(`Password reset completed for user ${user.username}`, {
        userId: user.id,
        ip: req.ip,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}
