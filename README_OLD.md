# 🚀 Mikro Undangan - Backend API

## 🎯 Tujuan

Backend API **Mikro Undangan** adalah RESTful API yang robust dan scalable untuk platform undangan digital. Dibangun dengan Node.js dan Express.js, menyediakan layanan lengkap mulai dari autentikasi, manajemen konten, hingga sistem pembayaran dan analytics.

## 📋 Dokumentasi

API Backend ini menyediakan layanan core untuk:
- 🔐 **Authentication & Authorization** dengan JWT dan Google OAuth
- 👥 **User Management** dengan role-based access control
- 🎨 **Template & Project Management** untuk undangan digital
- 📨 **Invitation System** dengan tracking dan analytics
- 💳 **Payment & Subscription** terintegrasi dengan Midtrans
- 📊 **Dashboard Analytics** untuk user dan admin
- 📧 **Email Service** untuk notifikasi dan verifikasi
- 📁 **File Management** untuk upload dan storage

---

## Teknologi yang Digunakan

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (dengan `pg` dan `pg-hstore`)
- **ORM:** Sequelize
- **Autentikasi:** JSON Web Tokens (JWT)
- **Hashing Password:** Bcrypt
- **File Uploads:** Multer
- **Email:** Nodemailer
- **Lainnya:** `cors`, `dotenv`, `cookie-parser`, `body-parser`
- **Dev Tools:** Nodemon, Sequelize-CLI

---

## Instalasi & Konfigurasi

1.  **Clone Repositori**
    ```bash
    git clone https://github.com/zakkutsu/node-mikro-undangan-be.git
    cd node-mikro-undangan-be
    ```

2.  **Install Dependensi**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**
    - Salin file `.env.example` menjadi `.env`.
      ```bash
      copy .env.example .env
      ```
    - Sesuaikan variabel di dalam file `.env` dengan konfigurasi database PostgreSQL, kredensial email (Nodemailer), dan secret key untuk JWT Anda.

4.  **Setup Database**
    - Pastikan server PostgreSQL Anda berjalan dan database yang sesuai dengan konfigurasi di `.env` telah dibuat.
    - Aplikasi akan melakukan sinkronisasi model dengan database secara otomatis saat dijalankan (`db.sync({ alter: true })`).

5.  **Jalankan Seeder (Penting!)**
    - Untuk mengisi data master seperti Role, Access Level, dan Kategori awal, jalankan seeder:
      ```bash
      npm run seed
      ```
    - Gunakan `npm run seed:force` jika Anda ingin menimpa data yang sudah ada.

6.  **Jalankan Aplikasi**
    - Jalankan server dalam mode development (menggunakan nodemon untuk auto-reload).
      ```bash
      npm run dev
      ```
    - Server akan berjalan di port yang ditentukan di file `.env` (default: 2222).

---

## Ringkasan Endpoint API

Semua endpoint berada di bawah prefix `/api/v1`.

- **Autentikasi (`/auth`)**
  - `POST /register`: Registrasi pengguna baru.
  - `POST /verify-otp`: Verifikasi akun dengan OTP.
  - `POST /request-otp`: Meminta ulang kode OTP.
  - `POST /login`: Login untuk mendapatkan Access Token.
  - `GET /refresh-token`: Mendapatkan Access Token baru menggunakan Refresh Token (via cookie).
  - `POST /logout`: Menghapus cookie Refresh Token.

- **Pengguna (`/users`)**
  - `GET /`: (Admin) Mengambil semua pengguna.
  - `POST /`: (Admin) Membuat pengguna baru.
  - `GET /:id`: (Admin) Mengambil detail satu pengguna.
  - `PUT /:id`: (Admin) Memperbarui data pengguna.
  - `DELETE /:id`: (Admin) Menghapus pengguna.
  - `PUT /:id/profile`: (User) Memperbarui profil sendiri.
  - `PATCH /:id/status`: (Admin) Mengubah status aktif/nonaktif pengguna.

- **Templates (`/templates`)**
  - `GET /`: Mendapatkan semua template.
  - `POST /`: (Admin) Membuat template baru (termasuk upload file).
  - `GET /:id`: Mendapatkan detail template.
  - `PUT /:id`: (Admin) Memperbarui template.
  - `DELETE /:id`: (Admin) Menghapus template.

- **Projects (`/projects`)**
  - `GET /`: Mendapatkan daftar project milik pengguna.
  - `POST /`: Membuat project baru.
  - `GET /:id`: Mendapatkan detail project.
  - `PUT /:id`: Memperbarui data project (JSON).
  - `DELETE /:id`: Menghapus project.

- **Invitations (`/invitations`)**
  - `GET /`: Mendapatkan daftar undangan milik pengguna.
  - `POST /create-full`: Membuat project dan undangan sekaligus.
  - `GET /:id`: Mendapatkan detail undangan.
  - `PUT /:id`: Memperbarui undangan.
  - `DELETE /:id`: Menghapus undangan beserta project-nya.

- **Data Master (Admin Only)**
  - `/roles`, `/categories`, `/payments`, `/discounts`, `/subscriptions`, `/system-contents`, `/sebars`, `/kata-ucapans`

---

## Struktur Database (Model Utama)

- `User`: Menyimpan data pengguna, termasuk relasi ke `Role`.
- `Role`: Mendefinisikan peran (misal: "Admin", "User"). Memiliki relasi Many-to-Many dengan `AccessLv`.
- `AccessLv`: Mendefinisikan hak akses spesifik (misal: "create_template").
- `Template`: Menyimpan data template undangan, berelasi dengan `Category`.
- `Project`: Menyimpan data kustomisasi dari sebuah template oleh pengguna.
- `Invitation`: Data inti undangan yang dibuat dari sebuah `Project`.
- `UcapanTamu`: Menyimpan ucapan dan status kehadiran dari tamu untuk sebuah `Invitation`.
- `Transaction`: Mencatat semua transaksi yang terjadi di platform.
