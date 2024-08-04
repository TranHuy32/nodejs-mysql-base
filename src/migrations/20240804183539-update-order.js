'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    });

    await queryInterface.addColumn('Orders', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('OrderItems', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    });

    await queryInterface.addColumn('OrderItems', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'updated_at');
    await queryInterface.removeColumn('Orders', 'deleted_at');
    await queryInterface.removeColumn('OrderItems', 'updated_at');
    await queryInterface.removeColumn('OrderItems', 'deleted_at');
  },
};
