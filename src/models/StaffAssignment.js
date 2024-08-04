import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class StaffAssignment extends Model {
    static associate(models) {
      StaffAssignment.belongsTo(models.User, { foreignKey: 'staff_id' }); // Liên kết StaffAssignment với User
      StaffAssignment.belongsTo(models.Product, { foreignKey: 'product_id' }); // Liên kết StaffAssignment với Product
    }
  }

  StaffAssignment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      staff_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Products',
          key: 'id',
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'in-progress', 'completed'),
        allowNull: false,
        defaultValue: 'pending',
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
      modelName: 'StaffAssignment',
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'StaffAssignments',
    },
  );

  return StaffAssignment;
};
