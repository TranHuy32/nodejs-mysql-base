'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      token: {
        type: Sequelize.STRING,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE', // Cập nhật khóa ngoại trong bảng Cars khi id trong bảng Users được cập nhật
        onDelete: 'NO ACTION', // Or 'CASCADE', 'RESTRICT', depending on your needs // Khi user bị xóa thì sẽ kh xóa được nếu còn car phụ thuộc
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tokens');
  },
};
