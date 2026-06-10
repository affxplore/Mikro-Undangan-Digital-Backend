// import { hash, compare } from 'bcrypt';
// import { sign } from 'jsonwebtoken';
// import { create, findOne } from '../../models/user';

// export async function register(req, res) {
//   try {
//     const { username, password } = req.body;
//     const hashed = await hash(password, 10);
//     const user = await create({ username, password: hashed });
//     res.json({ message: 'User registered', user });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }

// export async function login(req, res) {
//   try {
//     const { username, password } = req.body;
//     const user = await findOne({ where: { username } });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const valid = await compare(password, user.password);
//     if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

//     const token = sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
//       expiresIn: '1h'
//     });

//     res.json({ token });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// }

import { hash, compare } from "bcrypt";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
const { sign, verify } = jwt;
import crypto from "crypto";
import { buildPublicUrl } from "../../helpers/files.js";
// import User from "../../models/user.js"; // Pastikan path ke model User sudah benar
// import Role from "../../models/role.js"; // Pastikan path ke model Role sudah benar
// import AccessLv from "../../models/accessLv.js"; // Pastikan path ke model AccessLv sudah benar
// import Subscription from "../../models/subscription.js"; // <-- IMPORT BARU
// import LoginAuth from "../../models/loginAuth.js";

import models from "../../models/index.js";

const { 
  User, 
  Role, 
  AccessLv, 
  Subscription, 
  LoginAuth 
} = models;

import { generateUniqueUsername } from "./userController.js";
import { subscribe } from "diagnostics_channel";
import { sendVerificationEmail, sendResetPasswordEmail } from "../../helpers/emailService.js"; // <-- IMPORT BARU

// Anda bisa membuat helper terpisah untuk mengirim email
// import sendEmail from '../../helpers/emailHelper.js';


// REGISTER
export async function register(req, res) {
  try {
    const { full_name, email, password, whatsapp_number } = req.body;

    // Cek user yang mungkin sudah ada tapi belum aktif
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.isActive) {
      return res.status(400).json({ message: "Email sudah terdaftar." });
    }
    if (existingUser && !existingUser.isActive) {
      // Opsi: Hapus user lama atau perbarui OTP user lama.
      // Di sini kita tolak dulu agar user memakai fitur resend OTP.
      return res
        .status(400)
        .json({
          message:
            "Email terdaftar tapi belum aktif. Cek email Anda atau minta kirim ulang OTP.",
        });
    }

    // Selalu cari dan gunakan role 'User' untuk registrasi publik
    const defaultRole = await Role.findOne({ where: { name: "User" } });
    if (!defaultRole) {
      return res.status(500).json({
        error: "Role 'User' tidak ditemukan. Silakan hubungi administrator.",
      });
    }

    // Cari paket langganan default (misal: 'free')
    const defaultSubscription = await Subscription.findOne({ where: { slug: 'free' } });
    if (!defaultSubscription) {
      return res.status(500).json({
        error: "Paket langganan 'free' tidak ditemukan. Silakan hubungi administrator.",
      });
    }

    const hashedPassword = await hash(password, 12);
    const username = generateUniqueUsername(full_name);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Buat user baru dengan username yang sudah digenerate
    const newUser = await User.create({
      full_name,
      email,
      password: hashedPassword,
      whatsapp_number,
      username: username,
      role_id: defaultRole.id,
      subscription_id: defaultSubscription.id, // <-- GUNAKAN ID DARI PAKET FREE
      isActive: false, // <-- PENTING: Set ke false
      otp: otpCode, // <-- PENTING: Simpan OTP
    });

    await sendVerificationEmail(newUser.email, otpCode);

    res.status(201).json({
      meta: {
        status: "success",
        message:
          "Registrasi berhasil. Kode verifikasi telah dikirim ke email Anda.",
      },
      data: { email: newUser.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
          include: {
            model: AccessLv,
            as: "accessLevels",
            attributes: ["id", "code", "description"],
            through: { attributes: [] }, // Jangan sertakan data dari tabel junction
          },
        },
        {
          model: Subscription,
          as: "subscription",
          attributes: ['id', 'slug', 'name', 'invitation_limit', 'allow_branding_removal'],
          required: false
        },
      ],
    });

    // if (!user || !user.role)
    //   return res
    //     .status(404)
    //     .json({ message: "User atau role tidak ditemukan" });

    if (!user) {
      return res.status(404).json({ message: "Email tidak ditemukan" });
    }

    // --- TAMBAHAN VALIDASI STATUS AKTIF ---
    switch (user.status) {
      case "pending":
        return res
          .status(403)
          .json({ message: "Akun Anda belum aktif.", code: "ACCOUNT_PENDING" });
      case "banned":
        return res
          .status(403)
          .json({
            message: "Akun Anda telah ditangguhkan.",
            code: "ACCOUNT_BANNED",
          });
      case "confirmed":
        // Lanjutkan ke pengecekan password
        break;
      // ...
    }
    const valid = await compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Password salah" });

    // Susun daftar hak akses (permissions) dari 'code' di AccessLv
    const permissions = user.role.accessLevels.map((level) => level.code);

    // Buat payload untuk token, sertakan permissions
    const payload = {
      id: user.id,
      name: user.full_name,
      email: user.email,
        subscription: user.subscription ? user.subscription.name : null, // <-- UBAH INI

      role: user.role.name, // Kirim nama role, lebih informatif
      // permissions: permissions,
    };

    const accessToken = sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "60m",
    });
    const refreshToken = sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // 2. Kirim refreshToken sebagai httpOnly cookie (lebih aman dari localStorage)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true di production (HTTPS)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
      sameSite: "strict",
    });
    // // --- PENYESUAIAN DI SINI ---
    // // Hitung waktu kedaluwarsa dalam milidetik
    // const expires_in_ms = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // // Buat entri di login_auths TANPA menyimpan token
    // await LoginAuth.create({
    //   user_id: user.id,
    //   expired_at: expires_in_ms
    // });
    res.status(200).json({
      meta: {
        code: 200,
        status: "success",
        message: "Login berhasil.",
        is_paginated: false,
      },
      pagination: null,
      data: {
        accessToken: accessToken,
        // refreshToken: refreshToken, // Kirim juga refreshToken
        tokenType: "Bearer",
        expiresIn: 3600, // 1 jam dalam detik
        user: {
          // <-- Objek user yang dibutuhkan frontend
          id: user.id,
          full_name: user.full_name, // Kirim 'full_name' agar cocok dengan JSX
          username: user.username, // <-- TAMBAHKAN INI
          whatsapp_number: user.whatsapp_number,
          email: user.email,
          avatarUrl: user.profilePicture
            ? buildPublicUrl(user.profilePicture)
            : null,
          role: {
            id: user.role.id,
            name: user.role.name,
          },
          subscription: user.subscription ? {
            id: user.subscription.id,
            slug: user.subscription.slug,
            name: user.subscription.name,
            invitation_limit: user.subscription.invitation_limit,
            allow_branding_removal: user.subscription.allow_branding_removal,
          } : null,
          accessLevels: user.role.accessLevels.map((level) => ({
            id: level.id,
            code: level.code,
            description: level.description,
          })),
        },
      },
    });
  } catch (err) {
    console.error(err); // Log error untuk debugging
    res.status(500).json({ error: err.message });
  }
}

// VERIFIKASI OTP
export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      where: { email: email, isActive: false },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User tidak ditemukan atau sudah aktif." });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Kode OTP salah." });
    }

    // Cek kadaluarsa: 15 menit dari updatedAt
    const timeDifferenceInMinutes = (new Date() - user.updatedAt) / (1000 * 60);
    if (timeDifferenceInMinutes > 15) {
      return res
        .status(400)
        .json({
          message: "Kode OTP telah kadaluarsa. Silakan minta kode baru.",
        });
    }

    // Aktivasi Akun
    user.status = "confirmed";
    user.otp = null;
    await user.save(); // Hook beforeSave akan berjalan di sini

    res
      .status(200)
      .json({ message: "Verifikasi akun berhasil. Silakan login." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// REQUEST ULANG OTP
export async function requestOtp(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({
      where: { email: email, isActive: false },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Email tidak ditemukan atau akun sudah aktif." });
    }

    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = newOtpCode;
    await user.save(); // Ini akan memperbarui `updatedAt` secara otomatis

    await sendVerificationEmail(user.email, newOtpCode);

    res.status(200).json({ message: "Kode OTP baru telah dikirim." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// REFRESH TOKEN (MODIFIKASI)
export async function refreshToken(req, res) {
  console.log("\n[BACKEND] Endpoint /auth/refresh-token diakses.");
  
  try {
    const refreshToken = req.cookies.refreshToken;
      console.log("[BACKEND] Mencoba membaca refresh token dari cookie:", refreshToken);

    if (!refreshToken)
       console.log("[BACKEND] Gagal: Refresh token tidak ditemukan di cookie.");
 
      return res
        .status(401)
        .json({ message: "Refresh token tidak ditemukan." });

    // Verifikasi token tanpa perlu cek ke database
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) {
            console.error("[BACKEND] Gagal: Verifikasi refresh token gagal.", err.message);
     
          return res
            .status(403)
            .json({ message: "Token refresh tidak valid atau kedaluwarsa." });
        }

        console.log("[BACKEND] Sukses: Refresh token valid untuk user ID:", decoded.id);


        // Ambil data user terbaru untuk membuat payload accessToken yang fresh
        const user = await User.findOne({
          where: { id: decoded.id },
          include: { model: Role, as: "role" },
        });

        if (!user)
           console.error("[BACKEND] Gagal: User dengan ID dari token tidak ditemukan.");
      
          return res
            .status(403)
            .json({ message: "User untuk token ini tidak lagi ditemukan." });

        // Buat accessToken baru
        const payload = {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role.name,
        };
        const newAccessToken = sign(payload, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "15m",
        });
 console.log("[BACKEND] Sukses: Token akses baru dibuat dan dikirim ke frontend.");
    
        res.json({ accessToken: newAccessToken });
      }
    );
  } catch (err) {
     console.error("[BACKEND] Gagal: Terjadi error tak terduga di fungsi refreshToken.", err);
 
    res.status(500).json({ error: "Terjadi kesalahan server." });
  }
}

// LOGOUT (IMPLEMENTASI BARU)
export async function logout(req, res) {
  // Hapus cookie di sisi client
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return res.sendStatus(204);
}


// FUNGSI LUPA PASSWORD
export async function forgotPassword(req, res) {
  console.log("--- Forgot Password Dimulai ---");
  console.log("Request Body:", req.body);
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
 console.log("Hasil pencarian user:", user ? `Ditemukan user dengan ID: ${user.id}` : "User tidak ditemukan.");

    if (!user) {
      // Kirim respons sukses meskipun email tidak ditemukan
      // Ini adalah praktik keamanan untuk mencegah orang menebak email yang terdaftar.
      return res.status(200).json({ message: "Jika email Anda terdaftar, Anda akan menerima link reset password." });
    }

    // 1. Buat token acak
    const token = crypto.randomBytes(32).toString("hex");

    // 2. Set token dan waktu kadaluarsa (misal: 1 jam)
    user.resetPasswordToken = token;
   user.resetPasswordExpires = Date.now() + 900000; 
    await user.save();

    // 3. Buat link reset
     const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
 console.log("Reset Link yang dibuat:", resetLink);

    // Panggil fungsi yang spesifik dan bersih
    await sendResetPasswordEmail(user.email, resetLink);
 console.log("--- Forgot Password Berhasil ---");
   
    // Untuk saat ini, kita bisa log link-nya untuk testing
    console.log("Reset Link:", resetLink);


    res.status(200).json({ message: "Link reset password telah dikirim ke email Anda." });

  } catch (err) {
      console.error("!!! TERJADI ERROR DI FUNGSI FORGOT PASSWORD !!!");
    console.error("Detail Error:", err); // Tampilkan seluruh objek error
    
    res.status(500).json({ error: err.message });
  }
}

// FUNGSI RESET PASSWORD
export async function resetPassword(req, res) {
  try {
    const { token } = req.params; // Ambil token dari URL
    const { password } = req.body;

    // 1. Cari user berdasarkan token DAN pastikan token belum kadaluarsa
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }, // Op.gt berarti 'greater than'
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Token reset password tidak valid atau telah kadaluarsa." });
    }

    // 2. Jika token valid, update password
    user.password = await hash(password, 12);
    // 3. Hapus token agar tidak bisa digunakan lagi
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: "Password berhasil diubah. Silakan login dengan password baru Anda." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// export async function forgotPassword(req, res) {
//   return res
//     .status(501)
//     .json({ message: "Fitur reset password tidak diaktifkan." });
// }
// export async function resetPassword(req, res) {
//   return res
//     .status(501)
//     .json({ message: "Fitur reset password tidak diaktifkan." });
// }

// // --- FUNGSI LUPA PASSWORD ---
// export async function forgotPassword(req, res) {
//   try {
//     // 1. Dapatkan email dari body dan cari user
//     const { email } = req.body;
//     const user = await User.findOne({ where: { email } });

//     // 2. Kirim respons generik jika user tidak ditemukan untuk keamanan
//     // Ini mencegah orang lain menebak email mana yang terdaftar.
//     if (!user) {
//       return res.status(200).json({
//         message:
//           "Jika email Anda terdaftar, Anda akan menerima link reset password.",
//       });
//     }

//     // 3. Buat token reset yang acak dan aman
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     // 4. Hash token tersebut sebelum disimpan ke database
//     const passwordResetToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");

//     // 5. Set masa berlaku token (misalnya, 10 menit dari sekarang)
//     const passwordResetExpires = Date.now() + 10 * 60 * 1000;

//     // 6. Simpan token yang sudah di-hash dan masa berlakunya ke user
//     user.passwordResetToken = passwordResetToken;
//     user.passwordResetExpires = passwordResetExpires;
//     await user.save();

//     // 7. Buat URL reset (ini yang akan dikirim ke email user)
//     // Token yang dikirim di URL adalah token ASLI, bukan yang di-hash
//     const resetURL = `${req.protocol}://${req.get(
//       "host"
//     )}/api/v1/auth/reset-password/${resetToken}`;

//     // 8. Kirim email (untuk sekarang, kita tampilkan di konsol untuk testing)
//     const message = `Anda menerima email ini karena Anda (atau orang lain) meminta reset password untuk akun Anda.\n\nKlik link berikut, atau salin ke browser Anda untuk menyelesaikan proses:\n\n${resetURL}\n\nJika Anda tidak meminta ini, abaikan email ini dan password Anda tidak akan berubah.`;

//     console.error("\n\n==============================================");
//     console.error("🔑 SIMULASI PENGIRIMAN EMAIL RESET PASSWORD 🔑");
//     console.error("==============================================");
//     console.error(`Kepada: ${user.email}`);
//     console.error(`Link: ${resetURL}`);
//     console.error("==============================================\n\n");

//     /*
//     // Di aplikasi production, Anda akan menggunakan fungsi seperti ini:
//     await sendEmail({
//       to: user.email,
//       subject: 'Link Reset Password',
//       text: message
//     });
//     */
//     res
//       .status(200)
//       .json({ message: "Link reset password telah dikirim ke email Anda." });
//   } catch (err) {
//     // Jika terjadi error, pastikan token tidak tersimpan
//     // (Ini memerlukan penanganan error yang lebih detail di production)
//     res.status(500).json({ error: "Gagal mengirim email reset password." });
//   }
// }

// // --- FUNGSI RESET PASSWORD ---
// export async function resetPassword(req, res) {
//   try {
//     // 1. Dapatkan token dari parameter URL dan hash kembali
//     const hashedToken = crypto
//       .createHash("sha256")
//       .update(req.params.token)
//       .digest("hex");

//     // 2. Cari user berdasarkan token yang sudah di-hash DAN pastikan belum kedaluwarsa
//     const user = await User.findOne({
//       where: {
//         passwordResetToken: hashedToken,
//         passwordResetExpires: { [Op.gt]: Date.now() }, // Op.gt artinya "greater than"
//       },
//     });

//     // 3. Jika token tidak valid atau sudah kedaluwarsa
//     if (!user) {
//       return res
//         .status(400)
//         .json({ message: "Token tidak valid atau sudah kedaluwarsa." });
//     }

//     // 4. Jika token valid, update password user
//     const newHashedPassword = await hash(req.body.password, 12);
//     user.password = newHashedPassword;

//     // 5. Hapus token reset agar tidak bisa digunakan lagi
//     user.passwordResetToken = null;
//     user.passwordResetExpires = null;
//     await user.save();

//     res.status(200).json({ message: "Password berhasil direset." });
//   } catch (err) {
//     res.status(500).json({ error: "Gagal mereset password." });
//   }
// }

// // LOGOUT
// // ... di dalam authController.js

// export async function logout(req, res) {
//   try {
//     const { token } = req.body;
//     if (!token) return res.sendStatus(204);

//     await LoginAuth.destroy({ where: { token: token } });

//     // Selalu kirim respons sukses di akhir blok try
//     return res.status(204).send();
//   } catch (err) {
//     // Tangani kemungkinan error dan kirim respons error
//     return res.status(500).json({ error: "Gagal melakukan logout." });
//   }
// }

