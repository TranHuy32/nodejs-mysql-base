import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class School extends Model {
    static associate(models) {
      School.hasMany(models.User, { foreignKey: 'school_id' }); // Liên kết School với Users
      School.hasMany(models.Order, { foreignKey: 'school_id' }); // Liên kết School với Orders
    }
  }

  School.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
      address: {
        type: DataTypes.STRING,
        validate: {
          len: [0, 255],
        },
      },
      contact_number: {
        type: DataTypes.STRING,
        validate: {
          is: /^[0-9\-\+]{9,15}$/, // Regular expression for contact number validation
        },
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
      },
    },
    {
      sequelize,
      modelName: 'School',
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'Schools',
    },
  );

  return School;
};
