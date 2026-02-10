// Common TypeScript types used across the application

// HTTP Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  token: string;
  expiresIn: string;
}

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  INSPECTOR = 'Inspector',
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  USER = 'User'
}

// Certificate types
export interface Certificate {
  id: string;
  certificateId: string;
  userId: string;
  name: string;
  description?: string;
  type: CertificateType;
  status: CertificateStatus;
  recipientName?: string;
  recipientEmail?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revocationReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCertificateRequest {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  issueDate: Date;
  expiryDate?: Date;
  grade?: string;
  instructorId: number;
}

export interface UpdateCertificateRequest {
  studentName?: string;
  courseName?: string;
  issueDate?: Date;
  expiryDate?: Date;
  grade?: string;
  instructorId?: number;
  status?: CertificateStatus;
}

export enum CertificateStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending',
  DRAFT = 'draft',
  ISSUED = 'issued'
}

// Certificate types for service layer
export interface CertificateCreateInput {
  userId: string;
  name: string;
  description?: string;
  type: CertificateType;
  recipientName?: string;
  recipientEmail?: string;
  issueDate?: Date;
  expiryDate?: Date;
  metadata?: Record<string, any>;
}

export interface CertificateUpdateInput {
  name?: string;
  description?: string;
  type?: CertificateType;
  recipientName?: string;
  recipientEmail?: string;
  issueDate?: Date;
  expiryDate?: Date;
  metadata?: Record<string, any>;
}

export enum CertificateType {
  COMPLETION = 'completion',
  ACHIEVEMENT = 'achievement',
  PARTICIPATION = 'participation',
  EXCELLENCE = 'excellence'
}

// File upload types
export interface FileUpload {
  id: number;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: number;
  uploadedAt: Date;
}

export interface UploadResponse {
  file: FileUpload;
  url: string;
}

// Query parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CertificateQueryParams extends QueryParams {
  status?: CertificateStatus;
  instructorId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface UserQueryParams extends QueryParams {
  role?: UserRole;
  isActive?: boolean;
}

// JWT Payload
export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Request context
export interface RequestContext {
  user: JwtPayload;
  requestId: string;
  ip: string;
  userAgent: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;
}

// Database connection types
export interface DatabaseConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

// Email types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  requestId?: string;
  userId?: number;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Pagination helper
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

// Sorting helper
export interface SortOptions {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Search helper
export interface SearchOptions {
  search?: string;
  searchFields?: string[];
}

// Common query builder
export interface QueryOptions extends PaginationOptions, SortOptions, SearchOptions {
  filters?: Record<string, any>;
}

// Express Request types
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
    factoryId?: string;
  } & Record<string, any>;
}
