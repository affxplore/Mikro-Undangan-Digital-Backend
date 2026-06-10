'use strict';
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: Sequelize.STRING, allowNull: false, unique: true },
    full_name: { type: Sequelize.STRING }, // Tambahkan ini
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    password: { type: Sequelize.STRING, allowNull: false },
    whatsapp_number: { type: Sequelize.STRING },
    profile_picture: { type: Sequelize.STRING },
    role_id: { type: Sequelize.INTEGER }, // Penting untuk seeder
    subscription_id: { type: Sequelize.INTEGER },
    status: { 
      type: Sequelize.ENUM('pending', 'confirmed', 'banned'),
      defaultValue: 'pending' 
    },
    is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('users');
}