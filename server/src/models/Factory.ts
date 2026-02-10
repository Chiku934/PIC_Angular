import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface FactoryAttributes {
  id: number;
  name: string;
  registrationNumber: string;
  address: string;
  contactNumber?: string;
  email?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FactoryCreationAttributes extends Optional<FactoryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Factory extends Model<FactoryAttributes, FactoryCreationAttributes> implements FactoryAttributes {
  public id!: number;
  public name!: string;
  public registrationNumber!: string;
  public address!: string;
  public contactNumber?: string;
  public email?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Factory.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize: config,
  modelName: 'Factory',
  tableName: 'factories',
  timestamps: true,
});
