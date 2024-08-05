'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Orders', 'pay_status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Orders', 'pay_status');
  },
};
