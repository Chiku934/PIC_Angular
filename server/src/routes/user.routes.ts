import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// Public routes (none for users - all require authentication)

// Protected routes - require authentication
router.use(authenticate);

// Current user routes
router.get('/me', UserController.getCurrentUser);
router.get('/profile', UserController.getCurrentUser); // Alias for /me
router.put('/me', UserController.updateCurrentUser);

// Admin/Manager only routes
router.get('/', authorize([UserRole.ADMIN, UserRole.MANAGER]), UserController.getAllUsers);
router.get('/stats', authorize([UserRole.ADMIN, UserRole.MANAGER]), UserController.getUserStats);
router.post('/', authorize([UserRole.ADMIN]), UserController.createUser);
router.get('/:id', authorize([UserRole.ADMIN, UserRole.MANAGER]), UserController.getUserById);
router.put('/:id', authorize([UserRole.ADMIN]), UserController.updateUser);
router.delete('/:id', authorize([UserRole.ADMIN]), UserController.deleteUser);

export default router;
