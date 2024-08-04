import { Model, DataTypes } from 'sequelize';

export const OrderStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
};

export default (sequelize) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' }); // Liên kết Order với User
      Order.belongsTo(models.School, { as: 'school', foreignKey: 'school_id' }); // Liên kết Order với School
      Order.hasMany(models.OrderItem, { as: 'orderItems', foreignKey: 'order_id' }); // Liên kết Order với OrderItems
    }
  }

  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      school_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Schools',
          key: 'id',
        },
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'canceled'),
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
      modelName: 'Order',
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'Orders',
    },
  );

  return Order;
};
