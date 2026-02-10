import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface ItemAttributes {
  id: number;
  name: string;
  description?: string;
  category: string;
  unit: string;
  specifications?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ItemCreationAttributes extends Optional<ItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Item extends Model<ItemAttributes, ItemCreationAttributes> implements ItemAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public category!: string;
  public unit!: string;
  public specifications?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Item.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  specifications: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize: config,
  modelName: 'Item',
  tableName: 'items',
  timestamps: true,
});
