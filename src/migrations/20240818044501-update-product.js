'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.removeColumn('Products', 'origin_id');
    await queryInterface.dropTable('Origins');

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('Origins', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    await queryInterface.addColumn('Products', 'origin_id', {
      type: Sequelize.UUID,
      references: {
        model: 'Origins',
        key: 'id',
      },
      allowNull: false,
    });
  }
}