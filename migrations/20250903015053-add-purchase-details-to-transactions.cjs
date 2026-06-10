'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'purchase_type', {
      type: Sequelize.STRING,
      allowNull: true, // Izinkan null jika ada transaksi umum
    });
    await queryInterface.addColumn('transactions', 'related_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Izinkan null
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('transactions', 'purchase_type');
    await queryInterface.removeColumn('transactions', 'related_id');
  }
};