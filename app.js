// import express, { json } from "express";
// import cors from "cors";
// import db from "./config/database.js";
// import routers from "./routers/routers.js";
// import { config } from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";
// // import Example from './models/example.js';
// import Category from "./models/category.js";
// import Payment from "./models/payment.js";
// import Discount from "./models/discount.js";
// import Subscription from "./models/subscription.js";
// import Sebar from "./models/kategori_pesan.js";
// import SystemContent from "./models/systemcontent.js";
// import AccessLv from "./models/accessLv.js";
// import Role, { RoleAccessLv } from "./models/role.js";
// import User from "./models/user.js";
// import Project from "./models/project.js";
// import Kata_ucapan from "./models/template_pesan.js";
// import Template from "./models/template.js";
// import Invitation from "./models/invitation.js";
// import Receive_inv from "./models/receive_inv.js";
// import LoginAuth from "./models/loginAuth.js";
// import UcapanTamu from "./models/ucapanTamu.js";
// import Transaction from "./models/transaction.js";
// // import Affiliate from './models/affiliate.js';
// // import Rsvp from './models/rsvp.js';
// // import Konfigurasi from './models/konfigurasi.js';
// import bodyParser from "body-parser";
// import { initializeSeeder } from "./seeders/autoSeeder.js";
// import cookieParser from "cookie-parser"; // <-- Pastikan ini diimpor

// config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 2222;
// try {
//   await db.authenticate();
//   // await Example.sync();
//   // --- PERBAIKI URUTAN SINKRONISASI DI SINI ---

//   // 1. Tabel tanpa dependensi (atau yang menjadi referensi)
//   await AccessLv.sync();
//   await Role.sync();
//   await RoleAccessLv.sync();
//   await Category.sync();
//   await Payment.sync();
//   await Discount.sync();
//   await Subscription.sync();
//   await Sebar.sync();
//   await SystemContent.sync();

//   // 2. Tabel yang bergantung pada tabel di atas
//   await Kata_ucapan.sync();
//   await User.sync();
//   await Template.sync(); // Bergantung pada Category
//   await Project.sync(); // Bergantung pada Template dan User
//   await Invitation.sync(); // Bergantung pada Project

//   // 3. Tabel yang bergantung pada Invitation
//   await Receive_inv.sync();
//   await UcapanTamu.sync();

//   // 4. Tabel lainnya
//   await LoginAuth.sync();
//   await Transaction.sync();
//   // await Affiliate.sync();
//   // await Rsvp.sync();

//   // await db.sync();
//   await db.sync({ alter: true });
//   // console.log('Connection has been established successfully.');

//   // Initialize auto seeder
//   await initializeSeeder();
//   console.log("Database synchronized successfully.");
// } catch (error) {
//   console.error("Unable to connect or sync database:", error);
// }
// app.use(cookieParser()); // <-- Pastikan baris ini ada SEBELUM router

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:3000",
//       "http://127.0.0.1:5173",
//       "http://127.0.0.1:3000",
//       "https://your-production-domain.com",
//       "http://192.168.1.36:5174",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "Access-Control-Allow-Origin",
//     ],
//   })
// );

// // Middleware untuk mencegah caching pada semua respons API
// app.use((req, res, next) => {
//   res.set("Cache-Control", "no-store");
//   next();
// });

// app.use(bodyParser.json());

// app.use(bodyParser.urlencoded({ extended: true }));

// app.use("/public", express.static(path.join(__dirname, "public")));
// // app.use("/public", express.static("public"));

// app.use((req, res, next) => {
//   const start = Date.now();
//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     console.log(
//       `[DEBUG] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
//     );
//   });
//   next();
// });

// app.use(routers);

// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// import { config } from 'dotenv';
import { config } from 'dotenv';
config(); // WAJIB DI ATAS
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import db from './config/database.js';
import routers from './routers/routers.js';
import { initializeSeeder } from './utils/autoSeeder.js';

// Impor models/index.js (SATU BARIS INI menggantikan semua import individual di bawah)
// index.js akan: 1) Mendaftarkan SEMUA model ke Sequelize, 2) Memanggil associate() di setiap model
// sehingga FK constraints & relasi (belongsTo, hasMany, dll) terbentuk dengan benar di DB.
import './models/index.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 2222;

// --- URUTAN MIDDLEWARE YANG BENAR ---

// 1. CORS untuk menangani permintaan cross-origin terlebih dahulu
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://mikro-ud.dev.srv.nonionn.my.id',
    'https://mikro-ud.dev.srv.nonionn.my.id',
    'http://mikro.pg-sr.nonionn.my.id',
    'https://mikro.pg-sr.nonionn.my.id'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(passport.initialize()); // <-- TAMBAHKAN INI

// 2. Parser untuk Cookie, JSON, dan URL-Encoded
app.use(cookieParser());
app.use(express.json({ limit: '100mb' })); // HANYA gunakan ini untuk JSON
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // HANYA gunakan ini untuk URL-encoded

// 3. Middleware Logging
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`[DEBUG] ${req.method} ${req.originalUrl} - ${res.statusCode}`);
  });
  next();
});

// 4. Sajikan file statis
app.use("/public", express.static(path.join(__dirname, "public")));

// 5. Add root route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Mikro Undangan API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      projects: '/api/v1/projects',
      invitations: '/api/v1/invitations'
    }
  });
});

// 6. Gunakan router utama SETELAH semua parser dan middleware lain
app.use(routers);

// 7. Catch-all untuk 404 debugging
app.use((req, res, next) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: ['/api/v1/auth/login', '/api/v1/users', '/api/v1/projects']
  });
});

// --- INISIALISASI DATABASE DAN SERVER ---
const startServer = async () => {
  try {
    await db.authenticate();
    console.log('Koneksi database berhasil.');

    console.log("Isi objek db:", Object.keys(db));
    // Aktifkan sementara untuk membuat tabel yang belum ada
    await db.sync({ force: true }); 
    //delete woy janlup
    console.log("Semua model berhasil disinkronkan.");
    await initializeSeeder();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  } catch (error) {
    console.error("Gagal memulai server:", error);
  }
};

console.log("ENV TEST:", process.env.GOOGLE_CLIENT_ID);

startServer();
