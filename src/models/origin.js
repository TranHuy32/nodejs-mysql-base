import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class Origin extends Model {
    static associate(models) {
      Origin.hasMany(models.Product, { foreignKey: 'origin_id' }); // Liên kết Origin với Products
    }
  }

  Origin.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
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
      modelName: 'Origin',
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'Origins',
    },
  );

  return Origin;
};
