import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class UserSchool extends Model {
    static associate(models) {
      UserSchool.belongsTo(models.School, {
        as: 'school',
        foreignKey: 'school_id',
      });
      UserSchool.belongsTo(models.User, { as: 'user', foreignKey: 'user_id' });
    }
  }

  UserSchool.init(
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
      modelName: 'UserSchool',
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      tableName: 'UserSchools',
    },
  );

  return UserSchool;
};
