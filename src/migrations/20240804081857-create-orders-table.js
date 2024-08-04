'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id',
        },
        allowNull: false,
      },
      school_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Schools',
          key: 'id',
        },
        allowNull: false,
      },
      order_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  },
};
