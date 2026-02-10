import { DataTypes, Model, Optional } from 'sequelize';
import config from '@/config/database';

interface UserRoleMappingAttributes {
  UserId: number;
  RoleId: number;
  UserRoleMappingId: number;
}

interface UserRoleMappingCreationAttributes extends Optional<UserRoleMappingAttributes, 'UserRoleMappingId'> {}

export class UserRoleMapping extends Model<UserRoleMappingAttributes, UserRoleMappingCreationAttributes> implements UserRoleMappingAttributes {
  public UserId!: number;
  public RoleId!: number;
  public UserRoleMappingId!: number;
}

UserRoleMapping.init({
  UserId: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
  RoleId: {
    type: DataTypes.TINYINT,
    allowNull: false,
  },
  UserRoleMappingId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
}, {
  sequelize: config,
  modelName: 'UserRoleMapping',
  tableName: 'UserRoleMappings',
  timestamps: false,
});
