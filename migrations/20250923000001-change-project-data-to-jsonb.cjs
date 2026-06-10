'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('projects', 'project_data', {
      type: Sequelize.JSONB,
      allowNull: false
    });

    // Tambahkan index GIN untuk project_data
    await queryInterface.addIndex('projects', {
      fields: ['project_data'],
      using: 'gin',
      name: 'projects_project_data_gin'
    });
  },

  async down (queryInterface, Sequelize) {
    // Hapus index terlebih dahulu
    await queryInterface.removeIndex('projects', 'projects_project_data_gin');
    
    await queryInterface.changeColumn('projects', 'project_data', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  }
};