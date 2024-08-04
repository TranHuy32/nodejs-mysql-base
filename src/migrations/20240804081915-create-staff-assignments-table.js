'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StaffAssignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      staff_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id',
        },
        allowNull: false,
      },
      product_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Products',
          key: 'id',
        },
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StaffAssignments');
  },
};
