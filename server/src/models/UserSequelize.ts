import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface UserAttributes {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class UserSequelize extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public isActive!: boolean;
  public lastLogin?: Date;
  public failedLoginAttempts!: number;
  public lockUntil?: Date;
  public passwordChangedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserSequelize.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: config,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
});
