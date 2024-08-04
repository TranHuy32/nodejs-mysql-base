import { Model, DataTypes } from 'sequelize';
import CommonService from '../services/commonService';
import { UserRole } from '../common/constants';

export default (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Order, { foreignKey: 'user_id' }); // Liên kết User với Order
      User.belongsTo(models.School, { as: 'school', foreignKey: 'school_id' });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 50],
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 100],
        },
      },
      name: {
        type: DataTypes.STRING,
        validate: {
          len: [2, 100],
        },
      },
      role: {
        type: DataTypes.ENUM,
        values: Object.values(UserRole),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        defaultValue: UserRole.USER,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'User',
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'Users',
    },
  );

  User.beforeCreate(async (user, options) => {
    const hashedPassword = CommonService.hashPassword(user.password);
    user.password = hashedPassword;
    console.log('Before create');
  });

  User.addHook('beforeFind', (options) => {
    if (!options.where) {
      options.where = {};
    }
    options.where.deleted_at = null;
    console.log('Before find hook');
  });

  return User;
};
