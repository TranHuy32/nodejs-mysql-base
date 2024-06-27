import { Model, DataTypes } from 'sequelize';
import CommonService from '../services/commonService';
import { UserRole } from '../common/constants';

export default (sequelize) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Car, { foreignKey: 'user_id' }); // Thiết lập mối quan hệ hasMany với Car
    }
    // toJSON() {
    //   const attributes = { ...this.get() };
    //   delete attributes.createdAt;    // Khi trả ra json sẽ xóa createdAt
    //   delete attributes.updatedAt;
    //   delete attributes.deletedAt;
    //   return attributes;
    // }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: /^[0-9\-\+]{9,15}$/, // Regular expression for phone number validation
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 100], // validation: password should be between 6 and 100 characters
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
      underscored: true, // tự chuyển về snake case
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
