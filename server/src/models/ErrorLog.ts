import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface ErrorLogAttributes {
  id: number;
  message: string;
  stack?: string;
  userId?: number;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ErrorLogCreationAttributes extends Optional<ErrorLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ErrorLog extends Model<ErrorLogAttributes, ErrorLogCreationAttributes> implements ErrorLogAttributes {
  public id!: number;
  public message!: string;
  public stack?: string;
  public userId?: number;
  public endpoint?: string;
  public method?: string;
  public statusCode?: number;
  public userAgent?: string;
  public ipAddress?: string;
  public timestamp!: Date;
  public resolved!: boolean;
  public resolvedAt?: Date;
  public resolvedBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ErrorLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  stack: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  method: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  sequelize: config,
  modelName: 'ErrorLog',
  tableName: 'error_logs',
  timestamps: true,
});
