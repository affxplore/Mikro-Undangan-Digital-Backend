'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('discounts', {
      id: { allowSchema: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      code: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface) => { await queryInterface.dropTable('discounts'); }
};