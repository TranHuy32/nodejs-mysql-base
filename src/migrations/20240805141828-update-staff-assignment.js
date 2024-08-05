'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('StaffAssignments', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    });

    await queryInterface.addColumn('StaffAssignments', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('StaffAssignments', 'assign_date', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    });

    await queryInterface.removeColumn('StaffAssignments', 'status');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('StaffAssignments', 'updated_at');
    await queryInterface.removeColumn('StaffAssignments', 'deleted_at');
    await queryInterface.removeColumn('StaffAssignments', 'assign_date');
    await queryInterface.addColumn('StaffAssignments', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'pending',
    });
  },
};
