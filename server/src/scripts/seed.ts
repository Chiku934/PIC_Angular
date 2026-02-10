import { UserSequelize, Role, UserRoleMapping } from '../models';
import { hash } from 'bcrypt';
import { logger } from '../utils/logger';

export const seedDefaultData = async (): Promise<void> => {
  try {
    // Check if admin user already exists
    const existingAdmin = await UserSequelize.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      logger.info('Admin user already exists');
      return;
    }

    // Create default roles if they don't exist
    const roles = await Role.findAll();
    if (roles.length === 0) {
      const now = new Date().toISOString();
      await Role.bulkCreate([
        { RoleId: 1, RoleName: 'administrator', CreatedBy: 1, CreatedDate: now, UpdatedBy: '1', UpdatedDate: now, Deleted: 0 },
        { RoleId: 2, RoleName: 'admin', CreatedBy: 1, CreatedDate: now, UpdatedBy: '1', UpdatedDate: now, Deleted: 0 },
        { RoleId: 3, RoleName: 'user', CreatedBy: 1, CreatedDate: now, UpdatedBy: '1', UpdatedDate: now, Deleted: 0 }
      ]);
      logger.info('Default roles created');
    }

    // Get Administrator role
    const adminRole = await Role.findOne({
      where: { RoleName: 'administrator' }
    });

    if (!adminRole) {
      throw new Error('Administrator role not found');
    }

    // Create default admin user
    const hashedPassword = await hash('admin123', 12);
    const adminUser = await UserSequelize.create({
      username: 'admin',
      email: 'admin@pic.com',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      lastLogin: undefined,
      failedLoginAttempts: 0,
      lockUntil: undefined,
      passwordChangedAt: new Date(),
    });

    // Assign admin role to user
    await UserRoleMapping.create({
      UserId: adminUser.id,
      RoleId: adminRole.RoleId,
    });

    logger.info('Default admin user created successfully');
    logger.info('Username: admin');
    logger.info('Password: admin123');
    logger.info('Please change the password after first login');

  } catch (error) {
    logger.error('Error seeding default data:', error);
    throw error;
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedDefaultData()
    .then(() => {
      logger.info('Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}
