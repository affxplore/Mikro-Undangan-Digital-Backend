'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Backup data yang mungkin memiliki status yang tidak valid
    await queryInterface.sequelize.query(`
      UPDATE invitations 
      SET status = 'nonaktif' 
      WHERE status NOT IN ('aktif', 'nonaktif');
    `);

    // 2. Ubah tipe kolom status
    await queryInterface.sequelize.query(`
      ALTER TABLE invitations 
      ALTER COLUMN status 
      TYPE VARCHAR(255);
    `);

    // 3. Drop enum type lama jika ada
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_invitations_status;
    `);

    // 4. Buat enum type baru
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_invitations_status AS ENUM ('aktif', 'nonaktif');
    `);

    // 5. Ubah kolom untuk menggunakan enum baru
    await queryInterface.sequelize.query(`
      ALTER TABLE invitations 
      ALTER COLUMN status 
      TYPE enum_invitations_status 
      USING status::enum_invitations_status;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert perubahan jika diperlukan
    await queryInterface.sequelize.query(`
      ALTER TABLE invitations 
      ALTER COLUMN status 
      TYPE VARCHAR(255);
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_invitations_status;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_invitations_status AS ENUM ('nonaktif', 'aktif', 'banned');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE invitations 
      ALTER COLUMN status 
      TYPE enum_invitations_status 
      USING status::enum_invitations_status;
    `);
  }
};