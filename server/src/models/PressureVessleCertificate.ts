import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface PressureVessleCertificateAttributes {
  id: number;
  certificateNumber: string;
  issueDate: Date;
  expiryDate: Date;
  factoryId: number;
  vesselType: string;
  designPressure: number;
  designTemperature: number;
  materialSpecification: string;
  manufacturerName: string;
  yearOfManufacture: number;
  capacity: number;
  status: 'active' | 'expired' | 'revoked';
  createdAt?: Date;
  updatedAt?: Date;
}

interface PressureVessleCertificateCreationAttributes extends Optional<PressureVessleCertificateAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class PressureVessleCertificate extends Model<PressureVessleCertificateAttributes, PressureVessleCertificateCreationAttributes> implements PressureVessleCertificateAttributes {
  public id!: number;
  public certificateNumber!: string;
  public issueDate!: Date;
  public expiryDate!: Date;
  public factoryId!: number;
  public vesselType!: string;
  public designPressure!: number;
  public designTemperature!: number;
  public materialSpecification!: string;
  public manufacturerName!: string;
  public yearOfManufacture!: number;
  public capacity!: number;
  public status!: 'active' | 'expired' | 'revoked';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PressureVessleCertificate.init({
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
  vesselType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  designPressure: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  designTemperature: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  materialSpecification: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  manufacturerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  yearOfManufacture: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'revoked'),
    defaultValue: 'active',
  },
}, {
  sequelize: config,
  modelName: 'PressureVessleCertificate',
  tableName: 'pressure_vessel_certificates',
  timestamps: true,
});
