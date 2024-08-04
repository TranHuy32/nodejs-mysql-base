import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { foreignKey: 'category_id' }); // Liên kết Product với Category
      Product.belongsTo(models.Origin, { foreignKey: 'origin_id' }); // Liên kết Product với Origin
      Product.hasMany(models.OrderItem, { foreignKey: 'product_id' }); // Liên kết Product với OrderItems
      Product.hasMany(models.StaffAssignment, { foreignKey: 'product_id' }); // Liên kết Product với StaffAssignments
    }
  }

  Product.init(
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
      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'id',
        },
      },
      origin_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Origins',
          key: 'id',
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: true,
          min: 0,
        },
      },
      stock_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: true,
          min: 0,
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
      modelName: 'Product',
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'Products',
    },
  );

  return Product;
};
