'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('OrderItems', 'quantity', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('OrderItems', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
    });
  },
};