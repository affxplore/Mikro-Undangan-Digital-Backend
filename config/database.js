import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: process.env.NODE_ENV === 'production' ? false : console.log,

  // ============================================================
  // GLOBAL MODEL DEFAULTS
  // Semua model akan otomatis menggunakan opsi ini kecuali di-override.
  // Ini memastikan camelCase di JS di-map ke snake_case di database
  // secara konsisten di seluruh aplikasi.
  // ============================================================
  define: {
    underscored: true,        // camelCase JS → snake_case DB (misal: createdAt → created_at, googleId → google_id)
    timestamps: true,          // Aktifkan createdAt / updatedAt otomatis
    freezeTableName: true,     // Nama tabel tidak di-pluralkan otomatis
  },
});

export default db;