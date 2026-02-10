import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface InitialCertificateLTAttributes {
  id: number;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  factoryId: number;
  status: 'active' | 'expired' | 'revoked';
  createdAt?: Date;
  updatedAt?: Date;
}

interface InitialCertificateLTCreationAttributes extends Optional<InitialCertificateLTAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class InitialCertificateLT extends Model<InitialCertificateLTAttributes, InitialCertificateLTCreationAttributes> implements InitialCertificateLTAttributes {
  public id!: number;
  public certificateNumber!: string;
  public issueDate!: Date;
  public expiryDate!: Date;
  public factoryId!: number;
  public status!: 'active' | 'expired' | 'revoked';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InitialCertificateLT.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  certificateNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  factoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'factories',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'revoked'),
    defaultValue: 'active',
  },
}, {
  sequelize: config,
  modelName: 'InitialCertificateLT',
  tableName: 'initial_certificates_lt',
  timestamps: true,
});
