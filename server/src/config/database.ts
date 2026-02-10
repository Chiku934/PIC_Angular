import { Sequelize } from 'sequelize-typescript';
import { config } from './environment';

const sequelize = new Sequelize({
  dialect: 'mssql',
  host: config.DB_SERVER,
  port: config.DB_PORT,
  database: config.DB_NAME,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  logging: (msg) => {
    if (config.NODE_ENV === 'development') {
      console.log(msg);
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    options: {
      encrypt: config.DB_ENCRYPT,
      trustServerCertificate: config.DB_TRUST_CERTIFICATE,
      enableArithAbort: true,
    },
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
  sync: {
    force: false,
    alter: false,
  },
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    throw error;
  }
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed successfully.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    throw error;
  }
};

// Export sequelize instance
export { sequelize as db };

// Database health check
export const healthCheck = async (): Promise<{ status: string; responseTime: number }> => {
  const startTime = Date.now();
  try {
    await sequelize.authenticate();
    const responseTime = Date.now() - startTime;
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime,
    };
  }
};

// Get database statistics
export const getDatabaseStats = async (): Promise<any> => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as TotalTables
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);

    const stats = {
      totalTables: (results as any)[0]?.TotalTables || 0,
      connectionStatus: await healthCheck(),
      lastSync: new Date().toISOString(),
    };

    return stats;
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return {
      totalTables: 0,
      connectionStatus: { status: 'error', responseTime: 0 },
      lastSync: new Date().toISOString(),
    };
  }
};

export default sequelize;
