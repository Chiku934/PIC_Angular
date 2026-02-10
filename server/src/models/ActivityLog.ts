import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface ActivityLogAttributes {
  id: number;
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ActivityLogCreationAttributes extends Optional<ActivityLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ActivityLog extends Model<ActivityLogAttributes, ActivityLogCreationAttributes> implements ActivityLogAttributes {
  public id!: number;
  public userId?: number;
  public action!: string;
  public entity!: string;
  public entityId?: number;
  public details?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ActivityLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: config,
  modelName: 'ActivityLog',
  tableName: 'activity_logs',
  timestamps: true,
});
