import { Model, DataTypes } from 'sequelize';
import { getUrl } from '../services/imageService';

export default (sequelize) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, { as: 'category', foreignKey: 'category_id' }); // Liên kết Product với Category
      Product.belongsTo(models.Origin, { as: 'origin', foreignKey: 'origin_id' }); // Liên kết Product với Origin
      Product.hasMany(models.OrderItem, { as: 'orderItem', foreignKey: 'product_id' }); // Liên kết Product với OrderItems
      Product.hasMany(models.StaffAssignment, { as: 'staffAssignment', foreignKey: 'product_id' }); // Liên kết Product với StaffAssignments
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
      image_url: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          notEmpty: true,
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

  Product.afterFind(async (products) => {
    if (Array.isArray(products)) {
      products.forEach(product => {
        product.image_url = getUrl(product.image_url);
      });
    } else if (products && products.image_url) {
      products.image_url = getUrl(products.image_url);;
    }
  });

  return Product;
};
