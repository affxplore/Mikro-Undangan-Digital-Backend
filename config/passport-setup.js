import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import 'dotenv/config';
import User from '../models/user.js'; // Sesuaikan path jika perlu
import Role from '../models/role.js';
import { generateUniqueUsername } from '../controllers/user/userController.js';

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/google/callback', // Sesuai dengan yang di Google Console
        scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
        // Fungsi ini berjalan setelah user berhasil login di Google
        try {
            console.log("\n--- [PASSPORT GOOGLE] Proses Dimulai ---");
            console.log("Mencari user dengan Google ID:", profile.id);

            // --- LOGIKA YANG DIPERBAIKI ---

            // 1. Prioritas utama: Cari user berdasarkan Google ID.
            let user = await User.findOne({ where: { googleId: profile.id } });
console.log("[LOG A] Hasil pencarian awal via Google ID:", user ? JSON.stringify(user, null, 2) : "User Tidak Ditemukan");

            if (user) {
                console.log("Kesimpulan: User sudah ada, langsung login.");
        
                // User sudah ada dan tertaut dengan Google.
                // JANGAN UBAH DATA APAPUN. Langsung loginkan.
                console.log("User ditemukan via Google ID. Login...");
                return done(null, user);
            }
console.log("Mencari user via Email untuk ditautkan:", profile.emails[0].value);

            // 2. Jika tidak ketemu, cari berdasarkan email (untuk menautkan akun).
            user = await User.findOne({ where: { email: profile.emails[0].value } });

            if (user) {
                // User sudah ada (dari registrasi manual), tapi belum tertaut Google.
                // HANYA UPDATE googleId-nya. JANGAN sentuh data lain.
                // console.log("User ditemukan via Email. Menautkan akun Google...");
                console.log("[LOG B] User ditemukan via Email. Data SEBELUM ditautkan:", JSON.stringify(user, null, 2));
            
                user.googleId = profile.id;
                // Jika foto profil user masih kosong, kita bisa set dari Google.
                if (!user.profilePicture) {
                    user.profilePicture = profile.photos[0].value;
                }
                await user.save();
                console.log("[LOG C] Data SESUDAH ditautkan & disimpan:", JSON.stringify(user, null, 2));
                console.log("Kesimpulan: Akun ditautkan, login.");
            
                return done(null, user);
            }

            // 3. Jika tidak ketemu sama sekali, baru buat user baru.
            // console.log("User baru. Membuat akun dari profil Google...");
            console.log("User sama sekali tidak ditemukan. Membuat akun baru...");
        
            const defaultRole = await Role.findOne({ where: { name: 'User' } });
            const uniqueUsername = generateUniqueUsername(profile.displayName);

            const newUser = await User.create({
                googleId: profile.id,
                full_name: profile.displayName,
                email: profile.emails[0].value,
                username: uniqueUsername,
                profilePicture: profile.photos[0].value,
                role_id: defaultRole.id,
                status: 'confirmed',
                isActive: true,
            });
            console.log("[LOG D] Data user yang BARU DIBUAT:", JSON.stringify(newUser, null, 2));
            console.log("Kesimpulan: Akun baru dibuat, login.");
        
            return done(null, newUser);

        } catch (err) {
        console.error("!!! ERROR DI PASSPORT SETUP !!!", err);
        
            return done(err, null);
        }
    })
);