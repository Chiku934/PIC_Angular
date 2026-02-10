import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimiter } from '../middleware/rateLimit.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Login route
router.post('/login',
  rateLimiter.login,
  [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validateRequest,
  authController.login
);

// Logout route
router.post('/logout', authController.logout);

// Refresh token route
router.post('/refresh',
  rateLimiter.auth,
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],
  validateRequest,
  authController.refreshToken
);

// Change password route
router.post('/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      }),
  ],
  validateRequest,
  authController.changePassword
);

// Forgot password route
router.post('/forgot-password',
  rateLimiter.auth,
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
  ],
  validateRequest,
  authController.forgotPassword
);

// Reset password route
router.post('/reset-password',
  rateLimiter.auth,
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validateRequest,
  authController.resetPassword
);

export default router;
