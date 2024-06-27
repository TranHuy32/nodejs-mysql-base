import { Model, DataTypes } from 'sequelize';
import CommonService from '../services/commonService';

export default (sequelize) => {
  class Token extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Token.belongsTo(models.User, { foreignKey: 'user_id' }); // Thiết lập mối quan hệ belongsTo với User
    }
  }
  Token.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
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
    },
    {
      sequelize,
      modelName: 'Token',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'Tokens',
    },
  );

  Token.beforeCreate(async (token, options) => {
    const hashedToken = CommonService.hashToken(token.token);
    token.token = hashedToken;
    console.log('Before create');
  });

  return Token;
};
