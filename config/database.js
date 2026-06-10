import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Pastikan config dipanggil paling atas
dotenv.config();

// Tambahkan LOG ini untuk diagnosa (Hapus jika sudah berhasil)
console.log("--- DIAGNOSA KONEKSI ---");
console.log("DB NAME:", process.env.DB_NAME);
console.log("DB USER:", process.env.DB_USER);
console.log("DB HOST:", process.env.DB_HOST);
console.log("------------------------");

if (!process.env.DB_NAME) {
    console.error("❌ ERROR: Variabel DB_NAME tidak terbaca dari .env!");
}

const db = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASS, 
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log, // Biarkan true agar kita bisa lihat proses CREATE TABLE
    dialectOptions: {
        // Beberapa versi Postgres di Windows butuh ini, tapi coba tanpa ini dulu
    }
  }
);

export default db;