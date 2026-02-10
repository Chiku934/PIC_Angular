import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface PressureVessleCertificateDetailAttributes {
  id: number;
  certificateId: number;
  inspectionDate: Date;
  nextInspectionDate: Date;
  inspectorName: string;
  inspectorSignature?: string;
  testPressure: number;
  testResult: 'passed' | 'failed' | 'conditional';
  remarks?: string;
  attachments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PressureVessleCertificateDetailCreationAttributes extends Optional<PressureVessleCertificateDetailAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class PressureVessleCertificateDetail extends Model<PressureVessleCertificateDetailAttributes, PressureVessleCertificateDetailCreationAttributes> implements PressureVessleCertificateDetailAttributes {
  public id!: number;
  public certificateId!: number;
  public inspectionDate!: Date;
  public nextInspectionDate!: Date;
  public inspectorName!: string;
  public inspectorSignature?: string;
  public testPressure!: number;
  public testResult!: 'passed' | 'failed' | 'conditional';
  public remarks?: string;
  public attachments?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PressureVessleCertificateDetail.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  certificateId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pressure_vessel_certificates',
      key: 'id',
    },
  },
  inspectionDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  nextInspectionDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  inspectorName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  inspectorSignature: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  testPressure: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  testResult: {
    type: DataTypes.ENUM('passed', 'failed', 'conditional'),
    allowNull: false,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize: config,
  modelName: 'PressureVessleCertificateDetail',
  tableName: 'pressure_vessel_certificate_details',
  timestamps: true,
});
