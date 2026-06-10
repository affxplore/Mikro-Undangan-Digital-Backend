'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Menambah kolom untuk foreign key ke tabel 'payments'
    await queryInterface.addColumn('transactions', 'payment_id', {
      type: Sequelize.INTEGER,
      allowNull: false, // Setiap transaksi harus punya metode pembayaran
      references: {
        model: 'payments', // Nama tabel payments Anda
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Menambah kolom untuk foreign key ke tabel 'discounts'
    await queryInterface.addColumn('transactions', 'discount_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Diskon bersifat opsional
      references: {
        model: 'discounts', // Nama tabel discounts Anda
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('transactions', 'payment_id');
    await queryInterface.removeColumn('transactions', 'discount_id');
  }
};