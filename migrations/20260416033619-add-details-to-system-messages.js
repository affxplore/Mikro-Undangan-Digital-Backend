'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Menambahkan kolom name
    await queryInterface.addColumn('system_messages', 'name', {
      type: Sequelize.STRING,
      allowNull: true
    });
    // Menambahkan kolom email
    await queryInterface.addColumn('system_messages', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    });
    // Menambahkan kolom message (isi pesan utama)
    await queryInterface.addColumn('system_messages', 'message', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Menghapus kembali kolom jika migrasi di-undo
    await queryInterface.removeColumn('system_messages', 'name');
    await queryInterface.removeColumn('system_messages', 'email');
    await queryInterface.removeColumn('system_messages', 'message');
  }
};