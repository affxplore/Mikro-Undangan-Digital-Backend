import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import passport from 'passport';

import db from './config/database.js';
import routers from './routers/routers.js';
import { initializeSeeder } from './seeders/autoSeeder.js';

// Impor semua model agar terdaftar di Sequelize
import './models/category.js';
import './models/payment.js';
import './models/discount.js';
import './models/subscription.js';
import './models/kategori_pesan.js';
import './models/systemContent.js';
import './models/accessLv.js';
import './models/role.js';
import './models/user.js';
import './models/project.js';
import './models/template_pesan.js';
import './models/template_salam.js';
import './models/template.js';
import './models/invitation.js';
import './models/receive_inv.js';
import './models/loginAuth.js';
import './models/ucapanTamu.js';
import './models/transaksi.js';
import './models/trxDetail.js';
import './models/afiliasi.js';
import './models/price.js'; // <-- TAMBAHKAN DI SINI
import './models/komisi.js';
import './models/systemMessage.js';
import './models/userNotification.js';


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

    //await db.sync({ alter: true });
    console.log("Semua model berhasil disinkronkan.");
    
    await initializeSeeder();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server berjalan di port ${PORT}`);
    });
  } catch (error) {
    console.error("Gagal memulai server:", error);
  }
};

startServer();
