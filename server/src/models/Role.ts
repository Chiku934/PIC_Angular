import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface RoleAttributes {
  RoleId: number;
  RoleName: string;
  CreatedBy: number;
  CreatedDate: string;
  UpdatedBy: string;
  UpdatedDate: string;
  Deleted: number;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'RoleId'> {}

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public RoleId!: number;
  public RoleName!: string;
  public CreatedBy!: number;
  public CreatedDate!: string;
  public UpdatedBy!: string;
  public UpdatedDate!: string;
  public Deleted!: number;
}

Role.init({
  RoleId: {
    type: DataTypes.TINYINT,
    primaryKey: true,
  },
  RoleName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  CreatedBy: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
  CreatedDate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  UpdatedBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  UpdatedDate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Deleted: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
}, {
  sequelize: config,
  modelName: 'Role',
  tableName: 'Roles',
  timestamps: false,
});
