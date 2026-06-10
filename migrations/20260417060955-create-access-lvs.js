'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('access_lvs', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: Sequelize.STRING, unique: true },
    description: { type: Sequelize.TEXT },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
    updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') }
  });
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('access_lvs');
}