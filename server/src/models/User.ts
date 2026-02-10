import { User, UserRole, CreateUserRequest, UpdateUserRequest } from '@/types';
import { QueryTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

// Re-export the User type for use in other modules
export type { User, UserRole, CreateUserRequest, UpdateUserRequest };

/**
 * User Model class
 */
export class UserModel {
  /**
   * Find user by ID
   */
  static async findById(id: number): Promise<User | null> {
    // TODO: Implement actual database query
    // Example SQL Server query:
    // SELECT * FROM Users WHERE Id = @id AND IsActive = 1
    
    // Mock implementation
    return {
      id,
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Find user by email (using actual database)
   */
  static async findByUsername(email: string): Promise<User | null> {
    // TODO: Implement actual database query
    // Example SQL Server query:
    // SELECT * FROM Users WHERE Email = @email AND IsActive = 1
    
    try {
      // Query actual database
      const { db } = await import('@/config/database');
      const users = await db.query(`
        SELECT UserId, Email, FirstName, LastName, Password, IsActive, UserTypeId
        FROM users 
        WHERE Email = :email AND IsActive = 1
      `, {
        replacements: { email },
        type: QueryTypes.SELECT
      }) as any[];
      
      if (!users || users.length === 0) {
        return null;
      }

      const dbUser = users[0];
      
      // Map database user to our User interface
      return {
        id: dbUser.UserId,
        username: dbUser.Email, // Use email as username
        email: dbUser.Email,
        firstName: dbUser.FirstName || '',
        lastName: dbUser.LastName || '',
        role: this.mapUserTypeToRole(dbUser.UserTypeId),
        isActive: dbUser.IsActive === 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Map database UserTypeId to UserRole enum
   */
  private static mapUserTypeToRole(userTypeId: string): UserRole {
    switch (userTypeId) {
      case '1':
        return UserRole.ADMIN;
      case '2':
        return UserRole.INSPECTOR;
      case '3':
        return UserRole.MANAGER;
      default:
        return UserRole.USER;
    }
  }

  /**
   * Find user by email (alias for findByUsername)
   */
  static async findByEmail(email: string): Promise<User | null> {
    return this.findByUsername(email);
  }

  /**
   * Verify password against database (using bcrypt)
   */
  static async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const { db } = await import('@/config/database');
      const users = await db.query(`
        SELECT Password
        FROM users 
        WHERE Email = :email AND IsActive = 1
      `, {
        replacements: { email },
        type: QueryTypes.SELECT
      }) as any[];

      if (!users || users.length === 0) {
        return false;
      }

      const storedHashedPassword = users[0].Password;
      
      // Compare using bcrypt
      return await bcrypt.compare(password, storedHashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Create a new user
   */
  static async create(userData: CreateUserRequest): Promise<User> {
    // TODO: Implement actual database query
    // Example SQL Server query:
    // INSERT INTO Users (Username, Email, PasswordHash, FirstName, LastName, Role, IsActive, CreatedAt, UpdatedAt)
    // VALUES (@username, @email, @passwordHash, @firstName, @lastName, @role, 1, GETDATE(), GETDATE());
    // SELECT SCOPE_IDENTITY();
    
    // Mock implementation
    const newUser: User = {
      id: Math.floor(Math.random() * 1000) + 1,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newUser;
  }

  /**
   * Update user
   */
  static async update(id: number, userData: UpdateUserRequest): Promise<User | null> {
    // TODO: Implement actual database query
    // Example SQL Server query:
    // UPDATE Users 
    // SET Email = @email, FirstName = @firstName, LastName = @lastName, Role = @role, IsActive = @isActive, UpdatedAt = GETDATE()
    // WHERE Id = @id;
    // SELECT * FROM Users WHERE Id = @id;
    
    // Mock implementation
    const existingUser = await this.findById(id);
    if (!existingUser) return null;

    const updatedUser: User = {
      ...existingUser,
      ...userData,
      updatedAt: new Date()
    };

    return updatedUser;
  }

  /**
   * Delete user (soft delete)
   */
  static async delete(id: number): Promise<boolean> {
    // TODO: Implement actual database query
    // Example SQL Server query:
    // UPDATE Users SET IsActive = 0, UpdatedAt = GETDATE() WHERE Id = @id;
    
    // Mock implementation
    const existingUser = await this.findById(id);
    return existingUser !== null;
  }

  /**
   * Get all users with pagination
   */
  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters: {
      role?: UserRole;
      isActive?: boolean;
      search?: string;
    } = {}
  ): Promise<{ users: User[]; total: number }> {
    // TODO: Implement actual database query with pagination
    // Example SQL Server query:
    // SELECT * FROM Users 
    // WHERE (@role IS NULL OR Role = @role)
    // AND (@isActive IS NULL OR IsActive = @isActive)
    // AND (@search IS NULL OR (Username LIKE @search OR Email LIKE @search OR FirstName LIKE @search OR LastName LIKE @search))
    // ORDER BY CreatedAt DESC
    // OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    // 
    // For total count:
    // SELECT COUNT(*) FROM Users 
    // WHERE (@role IS NULL OR Role = @role)
    // AND (@isActive IS NULL OR IsActive = @isActive)
    // AND (@search IS NULL OR (Username LIKE @search OR Email LIKE @search OR FirstName LIKE @search OR LastName LIKE @search))
    
    // Mock implementation
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        username: 'inspector',
        email: 'inspector@example.com',
        firstName: 'Inspector',
        lastName: 'User',
        role: UserRole.INSPECTOR,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Apply filters
    let filteredUsers = mockUsers;
    
    if (filters.role) {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }
    
    if (filters.isActive !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.isActive === filters.isActive);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      total: filteredUsers.length
    };
  }

  /**
   * Check if username exists
   */
  static async usernameExists(username: string, excludeId?: number): Promise<boolean> {
    // TODO: Implement actual database query
    // Example SQL Server query:
    // SELECT COUNT(*) FROM Users WHERE Username = @username AND (@excludeId IS NULL OR Id != @excludeId) AND IsActive = 1
    
    // Mock implementation
    const existingUser = await this.findByUsername(username);
    return existingUser !== null && existingUser.id !== excludeId;
  }

  /**
   * Check if email exists
   */
  static async emailExists(email: string, excludeId?: number): Promise<boolean> {
    // TODO: Implement actual database query
    // Example SQL Server query:
    // SELECT COUNT(*) FROM Users WHERE Email = @email AND (@excludeId IS NULL OR Id != @excludeId) AND IsActive = 1
    
    // Mock implementation
    const existingUser = await this.findByEmail(email);
    return existingUser !== null && existingUser.id !== excludeId;
  }

  /**
   * Update user password
   */
  static async updatePassword(id: number, _passwordHash: string): Promise<boolean> {
    // TODO: Implement actual database query
    // Example SQL Server query:
    // UPDATE Users SET PasswordHash = @passwordHash, UpdatedAt = GETDATE() WHERE Id = @id;
    
    // Mock implementation
    const existingUser = await this.findById(id);
    return existingUser !== null;
  }

  /**
   * Get user statistics
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  }> {
    // TODO: Implement actual database query
    // Example SQL Server queries:
    // SELECT COUNT(*) as total FROM Users WHERE IsActive = 1;
    // SELECT COUNT(*) as active FROM Users WHERE IsActive = 1;
    // SELECT COUNT(*) as inactive FROM Users WHERE IsActive = 0;
    // SELECT Role, COUNT(*) as count FROM Users WHERE IsActive = 1 GROUP BY Role;
    
    // Mock implementation
    return {
      total: 150,
      active: 142,
      inactive: 8,
      byRole: {
        [UserRole.SUPER_ADMIN]: 2,
        [UserRole.INSPECTOR]: 20,
        [UserRole.ADMIN]: 5,
        [UserRole.MANAGER]: 8,
        [UserRole.USER]: 115
      }
    };
  }
}
