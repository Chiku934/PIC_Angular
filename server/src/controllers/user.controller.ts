import { Request, Response } from 'express';
import { UserModel } from '@/models/User';
import { ApiResponse, PaginatedResponse, CreateUserRequest, UpdateUserRequest, UserRole } from '@/types';
import { asyncHandler, forbidden, notFound, conflict } from '@/middleware/error.middleware';
import { hashPassword } from '@/utils/security';
import { logger } from '@/utils/logger';

/**
 * User Controller class
 */
export class UserController {
  /**
   * Get all users with pagination and filtering
   */
  static getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = '1',
      limit = '10',
      role,
      isActive,
      search
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        timestamp: new Date().toISOString()
      } as ApiResponse);
      return;
    }

    // Build filters
    const filters: any = {};
    if (role) filters.role = role as UserRole;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search as string;

    const { users, total } = await UserModel.findAll(pageNum, limitNum, filters);

    const totalPages = Math.ceil(total / limitNum);

    const response: PaginatedResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      timestamp: new Date().toISOString(),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    };

    res.json(response);
  });

  /**
   * Get user by ID
   */
  static getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = Number(id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      } as ApiResponse);
      return;
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      throw notFound('User not found');
    }

    const response: ApiResponse = {
      success: true,
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * Create new user
   */
  static createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData: CreateUserRequest = req.body;

    // Validate required fields
    const requiredFields = ['username', 'email', 'password', 'firstName', 'lastName'];
    const missingFields = requiredFields.filter(field => !userData[field as keyof CreateUserRequest]);

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString()
      } as ApiResponse);
      return;
    }

    // Check if username already exists
    const existingUsername = await UserModel.usernameExists(userData.username!);
    if (existingUsername) {
      throw conflict('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await UserModel.emailExists(userData.email!);
    if (existingEmail) {
      throw conflict('Email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password!);

    // Create user (without password in response)
    const { password, ...userWithoutPassword } = userData;
    const newUser = await UserModel.create({
      ...userWithoutPassword,
      role: userData.role || UserRole.USER,
      password: passwordHash
    });

    logger.info('User created successfully', {
      userId: newUser.id,
      username: newUser.username,
      createdBy: (req as any).user?.userId
    });

    const response: ApiResponse = {
      success: true,
      message: 'User created successfully',
      data: newUser,
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });

  /**
   * Update user
   */
  static updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = Number(id);
    const updateData: UpdateUserRequest = req.body;

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      } as ApiResponse);
      return;
    }

    // Check if user exists
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      throw notFound('User not found');
    }

    // Check if updating email and it already exists
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await UserModel.emailExists(updateData.email, userId);
      if (emailExists) {
        throw conflict('Email already exists');
      }
    }

    // Prevent users from updating their own role unless they are admin
    const currentUser = (req as any).user;
    if (currentUser.userId === userId && updateData.role && currentUser.role !== UserRole.ADMIN) {
      throw forbidden('Cannot update your own role');
    }

    const updatedUser = await UserModel.update(userId, updateData);

    if (!updatedUser) {
      throw notFound('User not found');
    }

    logger.info('User updated successfully', {
      userId: updatedUser.id,
      updatedBy: currentUser.userId,
      updatedFields: Object.keys(updateData)
    });

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * Delete user (soft delete)
   */
  static deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = Number(id);

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID',
        timestamp: new Date().toISOString()
      } as ApiResponse);
      return;
    }

    // Check if user exists
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      throw notFound('User not found');
    }

    // Prevent users from deleting themselves
    const currentUser = (req as any).user;
    if (currentUser.userId === userId) {
      throw forbidden('Cannot delete your own account');
    }

    // Prevent non-admins from deleting admins
    if (existingUser.role === UserRole.ADMIN && currentUser.role !== UserRole.ADMIN) {
      throw forbidden('Cannot delete admin users');
    }

    const deleted = await UserModel.delete(userId);

    if (!deleted) {
      throw notFound('User not found');
    }

    logger.info('User deleted successfully', {
      userId,
      deletedBy: currentUser.userId
    });

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * Get user statistics
   */
  static getUserStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const stats = await UserModel.getStats();

    const response: ApiResponse = {
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * Get current user profile
   */
  static getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const user = await UserModel.findById(currentUser.userId);

    if (!user) {
      throw notFound('User not found');
    }

    const response: ApiResponse = {
      success: true,
      message: 'Current user retrieved successfully',
      data: user,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  /**
   * Update current user profile
   */
  static updateCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const currentUser = (req as any).user;
    const updateData: UpdateUserRequest = req.body;

    // Remove role from update data for non-admin users
    if (currentUser.role !== UserRole.ADMIN) {
      delete updateData.role;
    }

    // Check if updating email and it already exists
    if (updateData.email) {
      const existingUser = await UserModel.findById(currentUser.userId);
      if (existingUser && updateData.email !== existingUser.email) {
        const emailExists = await UserModel.emailExists(updateData.email, currentUser.userId);
        if (emailExists) {
          throw conflict('Email already exists');
        }
      }
    }

    const updatedUser = await UserModel.update(currentUser.userId, updateData);

    if (!updatedUser) {
      throw notFound('User not found');
    }

    logger.info('Current user updated profile', {
      userId: updatedUser.id,
      updatedFields: Object.keys(updateData)
    });

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });
}
