// =================================================================
// AUTH MIDDLEWARE - JWT AUTHENTICATION & AUTHORIZATION
// =================================================================
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import Invitation from '../models/invitation.js';
import Project from '../models/project.js';

// Middleware untuk memverifikasi token
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Akses ditolak. Token tidak disediakan." });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Token tidak valid atau kedaluwarsa." });
        }
        
        // Simpan semua info dari token ke object request
        req.user = decoded; // Berisi { id, role, permissions }
        next();
    });
};

// Middleware untuk memeriksa role tertentu (misal: 'Admin')
export const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;
        
        if (userRole && allowedRoles.includes(userRole)) {
            return next(); // Lanjutkan jika role user termasuk dalam yang diizinkan
        }
        
        return res.status(403).json({ 
            message: `Akses ditolak. Perlu role: ${allowedRoles.join(' atau ')}.` 
        });
    };
};

// Middleware untuk memeriksa hak akses, DENGAN KEMAMPUAN SUPER ADMIN
export const hasPermission = (permissionCode) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: "Akses ditolak." });
        }

        const userRole = req.user.role;
        const userPermissions = req.user.permissions || [];

        // 1. Cek apakah user adalah 'Owner' atau 'Admin'
        //    Jika ya, langsung izinkan akses tanpa perlu cek permission spesifik.
        if (userRole === 'Owner' || userRole === 'Admin') {
            return next();
        }

        // 2. Jika bukan super user, cek apakah mereka punya permission yang dibutuhkan
        if (userPermissions.includes(permissionCode)) {
            return next();
        }
        
        // 3. Jika tidak punya, tolak akses
        return res.status(403).json({ message: "Anda tidak memiliki izin untuk melakukan aksi ini." });
    };
};


export const isProjectOwner = async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const { id: userId, role: userRole } = req.user;

    if (userRole === 'Admin' || userRole === 'Owner' || userRole === 'Super Admin') {
      return next();
    }

    const project = await Project.findByPk(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Proyek tidak ditemukan." });
    }

    if (project.created_by !== userId) {
      return res.status(403).json({ message: "Akses ditolak. Anda bukan pemilik proyek ini." });
    }

    next();
  } catch (error) {
    // --- TAMBAHKAN LOG DI SINI UNTUK MENANGKAP ERROR ---
    console.error("[BACKEND] FATAL ERROR di middleware isProjectOwner:", error);
    res.status(500).json({ message: "Kesalahan server saat verifikasi kepemilikan." });
  }
};


// export const isInvitationOwnerOrAdmin = async (req, res, next) => {
//   try {
//     const { id: invitationId } = req.params;
//     const { id: userId, role: userRole } = req.user;

//     // 1. Jika user adalah Admin/Owner, langsung berikan akses
//     if (userRole === 'Super Admin' || userRole === 'Owner' || userRole === 'Admin') {
//       return next();
//     }

//     // 2. Jika bukan admin, cari undangan dan cek pemiliknya
//     const invitation = await Invitation.findByPk(invitationId, {
//       include: {
//         model: Project,
//         as: 'project',
//         attributes: ['created_by'] // Hanya butuh kolom created_by
//       }
//     });

//     // 3. Jika undangan tidak ditemukan
//     if (!invitation) {
//       return res.status(404).json({ message: "Undangan tidak ditemukan." });
//     }

//     // 4. Bandingkan ID pemilik project dengan ID user yang sedang login
//     if (invitation.project.created_by !== userId) {
//       return res.status(403).json({ message: "Akses ditolak. Anda bukan pemilik undangan ini." });
//     }

//     // 5. Jika semua pengecekan lolos, berikan akses
//     next();
//   } catch (error) {
//     res.status(500).json({ message: "Kesalahan server saat verifikasi kepemilikan." });
//   }
// };


export const isInvitationOwnerOrAdmin = async (req, res, next) => {
  console.log(`[Middleware] Menjalankan isInvitationOwnerOrAdmin untuk invitation ID: ${req.params.id}`);
  try {
    const { id: invitationId } = req.params;
    const { id: userId, role: userRole } = req.user;

    // 1. Jika user adalah Admin/Owner, langsung berikan akses
    if (['Super Admin', 'Owner', 'Admin'].includes(userRole)) {
      console.log(`[Middleware] Akses diberikan untuk Admin: ${userRole}`);
      return next();
    }

    // 2. Jika bukan admin, cari undangan dan cek pemiliknya
    const invitation = await Invitation.findByPk(invitationId, {
      include: {
        model: Project,
        as: 'project',
        attributes: ['created_by'] // Hanya butuh kolom created_by
      }
    });

    // 3. Jika undangan tidak ditemukan
    if (!invitation) {
      console.error(`[Middleware] GAGAL: Undangan ID ${invitationId} tidak ditemukan.`);
      // Gunakan helper errorResponse agar formatnya konsisten
      return errorResponse(res, 404, "error", "Undangan tidak ditemukan.");
    }
    
    // --- PENGECEKAN KRUSIAL ---
    // 4. Pastikan relasi project ada sebelum mencoba mengaksesnya
    if (!invitation.project) {
        console.error(`[Middleware] GAGAL: Undangan ID ${invitationId} tidak memiliki relasi project yang valid.`);
        return errorResponse(res, 404, "error", "Data project untuk undangan ini tidak ditemukan.");
    }
    // --- AKHIR PENGECEKAN ---

    // 5. Bandingkan ID pemilik project dengan ID user yang sedang login
    console.log(`[Middleware] Pemilik Project: ${invitation.project.created_by}, User Saat Ini: ${userId}`);
    if (invitation.project.created_by !== userId) {
      console.error(`[Middleware] GAGAL: Akses ditolak. Pemilik tidak cocok.`);
      return errorResponse(res, 403, "error", "Akses ditolak. Anda bukan pemilik undangan ini.");
    }

    // 6. Jika semua pengecekan lolos, berikan akses
    console.log(`[Middleware] Akses diberikan untuk pemilik.`);
    next();
  } catch (error) {
    console.error("[Middleware] Terjadi error tak terduga:", error);
    errorResponse(res, 500, "error", "Kesalahan server saat verifikasi kepemilikan.");
  }
};