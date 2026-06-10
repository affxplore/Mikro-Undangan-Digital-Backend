"use strict";
const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Membuat tabel baru untuk refresh token
    await queryInterface.createTable("login_auths", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      expired_at: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Menghapus kolom-kolom lama dari tabel users
   
  },

  down: async (queryInterface, Sequelize) => {
    // Mengembalikan kolom-kolom lama ke tabel users (untuk rollback)
    await queryInterface.addColumn("users", "refresh_token", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "passwordResetToken", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "passwordResetExpires", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Menghapus tabel baru
    await queryInterface.dropTable("login_auths");
  },
};
