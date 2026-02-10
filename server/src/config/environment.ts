import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  // Database
  DB_SERVER: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_ENCRYPT: boolean;
  DB_TRUST_CERTIFICATE: boolean;

  // Server
  PORT: number;
  NODE_ENV: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // CORS
  CORS_ORIGIN: string;

  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE: string;

  // Email (Optional)
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;

  // Application
  APP_NAME: string;
  APP_VERSION: string;
  APP_URL: string;

  // Security
  BCRYPT_ROUNDS: number;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
  ENCRYPTION_KEY: string;

  // Session
  SESSION_SECRET: string;
  SESSION_TIMEOUT: number;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue?: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value.toLowerCase() === 'true';
};

export const config: EnvironmentConfig = {
  // Database
  DB_SERVER: getEnvVar('DB_SERVER', 'localhost'),
  DB_PORT: getEnvNumber('DB_PORT', 1433),
  DB_NAME: getEnvVar('DB_NAME', 'PIC_Certificates_Angular'),
  DB_USER: getEnvVar('DB_USER', 'DRS@2026'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD', 'DRS@2026'),
  DB_ENCRYPT: getEnvBoolean('DB_ENCRYPT', false),
  DB_TRUST_CERTIFICATE: getEnvBoolean('DB_TRUST_CERTIFICATE', true),

  // Server
  PORT: getEnvNumber('PORT', 3000),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),

  // JWT
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '24h'),

  // CORS
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', 'http://localhost:4200'),

  // File Upload
  MAX_FILE_SIZE: getEnvNumber('MAX_FILE_SIZE', 10485760), // 10MB
  UPLOAD_PATH: getEnvVar('UPLOAD_PATH', './uploads'),

  // Logging
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  LOG_FILE: getEnvVar('LOG_FILE', './logs/app.log'),

  // Email (Optional)
  EMAIL_HOST: process.env['EMAIL_HOST'] || undefined,
  EMAIL_PORT: process.env['EMAIL_PORT'] ? getEnvNumber('EMAIL_PORT') : undefined,
  EMAIL_USER: process.env['EMAIL_USER'] || undefined,
  EMAIL_PASS: process.env['EMAIL_PASS'] || undefined,

  // Application
  APP_NAME: getEnvVar('APP_NAME', 'PIC Certificates Management System'),
  APP_VERSION: getEnvVar('APP_VERSION', '1.0.0'),
  APP_URL: getEnvVar('APP_URL', 'http://localhost:4200'),

  // Security
  BCRYPT_ROUNDS: getEnvNumber('BCRYPT_ROUNDS', 12),
  RATE_LIMIT_WINDOW: getEnvNumber('RATE_LIMIT_WINDOW', 15), // minutes
  RATE_LIMIT_MAX: getEnvNumber('RATE_LIMIT_MAX', 100), // requests per window
  ENCRYPTION_KEY: getEnvVar('ENCRYPTION_KEY'),

  // Session
  SESSION_SECRET: getEnvVar('SESSION_SECRET'),
  SESSION_TIMEOUT: getEnvNumber('SESSION_TIMEOUT', 3600000), // 1 hour in milliseconds
};

// Validate environment variables
export const validateEnvironment = (): void => {
  const requiredVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate specific values
  if (config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (config.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  if (config.PORT < 1 || config.PORT > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }

  if (config.DB_PORT < 1 || config.DB_PORT > 65535) {
    throw new Error('DB_PORT must be between 1 and 65535');
  }

  console.log('✅ Environment variables validated successfully');
};

// Development environment check
export const isDevelopment = (): boolean => config.NODE_ENV === 'development';
export const isProduction = (): boolean => config.NODE_ENV === 'production';
export const isTest = (): boolean => config.NODE_ENV === 'test';

// Get database URL
export const getDatabaseUrl = (): string => {
  return `mssql://${config.DB_USER}:${config.DB_PASSWORD}@${config.DB_SERVER}:${config.DB_PORT}/${config.DB_NAME}?encrypt=${config.DB_ENCRYPT}&trustServerCertificate=${config.DB_TRUST_CERTIFICATE}`;
};

// Export individual config values for convenience
export const {
  DB_SERVER,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_ENCRYPT,
  DB_TRUST_CERTIFICATE,
  PORT,
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CORS_ORIGIN,
  MAX_FILE_SIZE,
  UPLOAD_PATH,
  LOG_LEVEL,
  LOG_FILE,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  APP_NAME,
  APP_VERSION,
  APP_URL,
  BCRYPT_ROUNDS,
  RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX,
  ENCRYPTION_KEY,
  SESSION_SECRET,
  SESSION_TIMEOUT,
} = config;

export default config;
