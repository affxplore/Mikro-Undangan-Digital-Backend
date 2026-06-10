// config/config.js

require("dotenv").config(); // Ini akan memuat variabel dari file .env

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '123',
    database: process.env.DB_NAME || 'micro_ub',
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
  },
  test: {
    // Konfigurasi untuk lingkungan testing (jika ada)
    username: process.env.CI_DB_USERNAME,
    password: process.env.CI_DB_PASSWORD,
    database: process.env.CI_DB_NAME,
    host: "127.0.0.1",
    dialect: "postgres",
  },
  production: {
    // Konfigurasi untuk lingkungan production (gunakan variabel env production)
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASS,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    dialect: "postgres",
  },
};
