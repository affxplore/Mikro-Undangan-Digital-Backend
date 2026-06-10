  import User from "../../models/user.js";
  import {
    GetDataList,
    GetDataById,
    CreateData,
    UpdateData,
    DeleteData,
    userResponse,
  } from "../../models/user.js";
import Subscription from "../../models/subscription.js";
  import { successResponse, errorResponse } from "../../helpers/response.js";
  import { calculatePagination } from "../../helpers/paginate.js";
  import bcrypt from "bcrypt";
  import path from "path";
  import db from "../../config/database.js";
  import { Sequelize, Op } from "sequelize";
  import {
    safeUnlink,
    buildPublicUrl,
    relFromPublic,
  } from "../../helpers/files.js";

  /**
   * Generate username sederhana dari full_name.
   * - lowercased
   * - hilangkan spasi
   * - hanya alfanumerik
   * - tambah 3 digit random
   */
  export function generateUniqueUsername(fullName) {
    if (!fullName || typeof fullName !== "string") return "";
    const base = fullName
      .normalize("NFKD") // bersihin aksen
      .replace(/[\u0300-\u036f]/g, "") // strip diacritics
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, ""); // hanya a-z0-9
    const randomNumber = Math.floor(100 + Math.random() * 900);
    return `${base}${randomNumber}`;
  }

  // ===================================================
  // GET: all users
  // ===================================================
  export const getAllUsers = async (req, res) => {
    try {
      const { page = 1, limit = 10, sort, filter } = req.query;

      // filter bisa dikirim sebagai JSON string di query
      let parsedFilter = {};
      if (typeof filter === "string") {
        try {
          parsedFilter = JSON.parse(filter);
        } catch {
          parsedFilter = {};
        }
      } else if (typeof filter === "object" && filter !== null) {
        parsedFilter = filter;
      }

      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: typeof sort === "string" ? sort : undefined,
      };

      const result = await GetDataList(pagination, parsedFilter);
      const paginationData = calculatePagination(pagination, result.totalRows);

      // Map profilePicture (relative) -> public URL

      const withUrls = result.userList.map((u) => {
        const plainUser = u.get({ plain: true });
        // Hapus password dari objek
        delete plainUser.password;

        return {
          ...plainUser,
          profilePicture: u.profilePicture
            ? buildPublicUrl(u.profilePicture)
            : null,
        };
      });

      successResponse(
        res,
        200,
        "success",
        "Users retrieved successfully",
        true,
        paginationData,
        withUrls
      );
    } catch (error) {
      errorResponse(
        res,
        400,
        "error",
        error.message || "Failed to retrieve users",
        false,
        null,
        null
      );
    }
  };

  // ===================================================
  // GET: user by id
  // ===================================================
  export const getUserById = async (req, res) => {
    try {
      const { id } = req.params;
      const user = await GetDataById(id);

      if (!user) {
        return errorResponse(
          res,
          404,
          "error",
          "User not found",
          false,
          null,
          null
        );
      }

      const payload = {
        ...user.get({ plain: true }),
        profilePicture: user.profilePicture
          ? buildPublicUrl(user.profilePicture)
          : null,
      };
      delete payload.password;
      successResponse(
        res,
        200,
        "success",
        "User retrieved successfully",
        false,
        null,
        payload
      );
    } catch (error) {
      errorResponse(res, 400, "error", error.message, false, null, null);
    }
  };

  // ===================================================
  // POST: create user
  // ===================================================
  // export const createUser = async (req, res) => {
  //   const trx = await db.transaction();
  //   let newFileAbsPath = null;

  //   try {
  //     let {
  //       username,
  //       full_name,
  //       whatsapp_number,
  //       email,
  //       password,
  //       role_id,
  //       isActive = true,
  //       subscription = null
  //     } = req.body;

  //     if (!full_name || !whatsapp_number || !email || !password) {
  //       throw new Error('full_name, whatsapp_number, email, dan password wajib diisi.');
  //     }

  //     // auto username jika kosong
  //     if (!username || String(username).trim() === '') {
  //       username = generateUniqueUsername(full_name);
  //     }

  //     const hashed = await bcrypt.hash(String(password), 12);

  //     let profilePictureRel = null;
  //     if (req.file) {
  //       newFileAbsPath = req.file.path;          // absolute path dari multer
  //       profilePictureRel = relFromPublic(req.file.path); // simpan REL path (contoh: "/uploads/profile/xxx.jpg")
  //     }

  //     const payload = {
  //       username,
  //       full_name,
  //       whatsapp_number,
  //       email,
  //       password: hashed,
  //       role_id: role_id ?? null,
  //       profilePicture: profilePictureRel,        // simpan REL di DB
  //       isActive: isActive,
  //       subscription
  //     };

  //     const created = await CreateData(trx, payload);
  //     const userWithRole = await GetDataById(created.id); // Ambil lagi datanya dengan role
  //     await trx.commit();

  //    // Hapus password dari response
  //     const responsePayload = userWithRole.get({ plain: true });
  //     delete responsePayload.password;

  //     return successResponse(
  //       res,
  //       201,
  //       'success',
  //       'User created',
  //       false,
  //       null,
  //       {
  //         id: created.id,
  //         username: created.username,
  //         full_name: created.full_name,
  //         whatsapp_number: created.whatsapp_number,
  //         email: created.email,
  //         role_id: created.role_id,
  //         // profilePicture: created.profilePicture ? buildPublicUrl(created.profilePicture) : null,
  //         isActive: created.isActive,
  //         subscription: created.subscription,
  //         createdAt: created.createdAt,
  //         profilePicture: responsePayload.profilePicture ? buildPublicUrl(responsePayload.profilePicture) : null,

  //       }
  //     );
  //   } catch (error) {
  //     await trx.rollback();
  //     if (newFileAbsPath) await safeUnlink(newFileAbsPath);

  //     if (error instanceof Sequelize.UniqueConstraintError) {
  //       const field = error.errors[0]?.path;
  //       let message = 'Data sudah terdaftar.';
  //       if (field === 'email') message = 'Email sudah terdaftar.';
  //       if (field === 'username') message = 'Username sudah terdaftar.';
  //       return errorResponse(res, 409, 'error', message, false, null, null);
  //     }

  //     return errorResponse(res, 400, 'error', error.message || 'Gagal membuat user.', false, null, null);
  //   }
  // };

  // export const createUser = async (req, res) => {
  //   // 1. Memulai transaksi database
  //   const trx = await db.transaction();
  //   let newFileAbsPath = null;

  //   try {
  //     // 2. Mengambil dan memvalidasi data dari request body
  //     let {
  //       username,
  //       full_name,
  //       whatsapp_number,
  //       email,
  //       password,
  //       role_id,
  //       // isActive = true,
  //       subscription = "free",
  //     } = req.body;

      // if (!full_name || !whatsapp_number || !email || !password) {
      //   throw new Error(
      //     "Nama lengkap, nomor WhatsApp, email, dan password wajib diisi."
      //   );
      // }

      // // 3. Membuat username secara otomatis jika kosong
      // if (!username || String(username).trim() === "") {
      //   username = generateUniqueUsername(full_name);
      // }

  //     // 4. Meng-hash password sebelum disimpan
  //     const hashed = await bcrypt.hash(String(password), 12);

      // // 5. Menangani upload file gambar profil
      // let profilePictureRel = null;
      // if (req.file) {
      //   newFileAbsPath = req.file.path;
      //   profilePictureRel = relFromPublic(req.file.path);

      //   // ================== TAMBAHKAN LOG DI SINI ==================
      //   console.log("--- DEBUG FILE UPLOAD ---");
      //   console.log("1. Objek req.file dari Multer:", req.file);
      //   console.log(
      //     "2. Path Absolut (Input untuk relFromPublic):",
      //     newFileAbsPath
      //   );

      //   profilePictureRel = relFromPublic(req.file.path);

      //   console.log(
      //     "3. Path Relatif (Output dari relFromPublic):",
      //     profilePictureRel
      //   );
      //   console.log("--------------------------");
      //   // ==========================================================
      // }
  //     // 6. Mempersiapkan payload data untuk disimpan ke database
  //     const payload = {
  //       username,
  //       full_name,
  //       whatsapp_number,
  //       email,
  //       password: hashed,
  //       role_id: role_id ?? null,
  //       profilePicture: profilePictureRel,
  //       // isActive: isActive,
  //       subscription,
  //       status: 'confirmed', 
      
  //     };

  //     // TAMBAHKAN BARIS INI UNTUK DEBUG
  //     console.log("PAYLOAD YANG AKAN DISIMPAN:", payload);

  //     // 7. Menyimpan data ke database menggunakan fungsi dari model
  //     const created = await CreateData(trx, payload);

  //     // 8. Mempersiapkan data yang akan dikirim sebagai respons
  //     // Ini dilakukan sebelum commit untuk menangkap error jika ada
      // const responsePayload = {
      //   id: created.id,
      //   username: created.username,
      //   full_name: created.full_name,
      //   whatsapp_number: created.whatsapp_number,
      //   email: created.email,
      //   role_id: created.role_id,
      //   profilePicture: created.profilePicture
      //     ? buildPublicUrl(created.profilePicture)
      //     : null,
      //   // isActive: created.isActive,
      //   subscription: created.subscription,
      //   status: created.status,
      //   // Jika Anda tidak menggunakan timestamps, hapus baris createdAt
      //   // createdAt: created.createdAt
      // };

  //     // 9. Commit transaksi HANYA JIKA semua langkah di atas berhasil
  //     await trx.commit();

      // // 10. Mengirim respons sukses ke client
      // return successResponse(
      //   res,
      //   201,
      //   "success",
      //   "User berhasil dibuat",
      //   false,
      //   null,
      //   responsePayload
      // );
  //   } catch (error) {
  //     // 11. Jika terjadi error di titik mana pun dalam blok 'try', batalkan semua perubahan
  //     await trx.rollback();

  //     // TAMBAHKAN BARIS INI UNTUK MELIHAT DETAIL ERROR
  //     console.log("===== ERROR DETAIL =====");
  //     console.log(error);
  //     console.log("========================");

  //     // Hapus file yang terlanjur di-upload jika ada error
  //     if (newFileAbsPath) {
  //       await safeUnlink(newFileAbsPath);
  //     }

  //     // 12. Menangani error spesifik (seperti email/username duplikat)
  //     if (error instanceof Sequelize.UniqueConstraintError) {
  //       const field = error.errors[0]?.path;
  //       let message = "Data sudah terdaftar.";
  //       if (field === "email") message = "Email sudah terdaftar.";
  //       if (field === "username") message = "Username sudah terdaftar.";
  //       return errorResponse(res, 409, "error", message, false, null, null);
  //     }

  //     // 13. Mengirim respons error umum
  //     return errorResponse(
  //       res,
  //       400,
  //       "error",
  //       error.message || "Gagal membuat user.",
  //       false,
  //       null,
  //       null
  //     );
  //   }
  // };

  export const createUser = async (req, res) => {
  const trx = await db.transaction();
  try {
    let {
      username,
      full_name,
      whatsapp_number,
      email,
      password,
      role_id,
    } = req.body;

   
      if (!full_name || !whatsapp_number || !email || !password) {
        throw new Error(
          "Nama lengkap, nomor WhatsApp, email, dan password wajib diisi."
        );
      }

      // 3. Membuat username secara otomatis jika kosong
      if (!username || String(username).trim() === "") {
        username = generateUniqueUsername(full_name);
      }

    // --- PERBAIKAN LOGIKA LANGGANAN ---
    // 2. Cari ID untuk paket 'Free' di database
    const freePlan = await Subscription.findOne({ where: { slug: 'free' } });
    if (!freePlan) {
      // Jika paket free tidak ada, batalkan proses
      throw new Error("Paket 'Free' tidak ditemukan di database. Tidak bisa mendaftarkan user baru.");
    }
    // --- AKHIR PERBAIKAN ---

    const hashed = await bcrypt.hash(String(password), 12);
    
     // 5. Menangani upload file gambar profil
      let profilePictureRel = null;
      if (req.file) {
        newFileAbsPath = req.file.path;
        profilePictureRel = relFromPublic(req.file.path);

        // ================== TAMBAHKAN LOG DI SINI ==================
        console.log("--- DEBUG FILE UPLOAD ---");
        console.log("1. Objek req.file dari Multer:", req.file);
        console.log(
          "2. Path Absolut (Input untuk relFromPublic):",
          newFileAbsPath
        );

        profilePictureRel = relFromPublic(req.file.path);

        console.log(
          "3. Path Relatif (Output dari relFromPublic):",
          profilePictureRel
        );
        console.log("--------------------------");
        // ==========================================================
      }

    const payload = {
      username,
      full_name,
      whatsapp_number,
      email,
      password: hashed,
      role_id: role_id ?? 3, // Default ke role 'User' jika tidak ada
      status: 'pending', // Asumsi user langsung pending
      subscription_id: freePlan.id, // <-- 3. Gunakan ID dari paket Free, bukan string "free"
    };

    const created = await CreateData(trx, payload);
     const responsePayload = {
        id: created.id,
        username: created.username,
        full_name: created.full_name,
        whatsapp_number: created.whatsapp_number,
        email: created.email,
        role_id: created.role_id,
        profilePicture: created.profilePicture
          ? buildPublicUrl(created.profilePicture)
          : null,
        // isActive: created.isActive,
        subscription: created.subscription,
        status: created.status,
        // Jika Anda tidak menggunakan timestamps, hapus baris createdAt
        // createdAt: created.createdAt
      };
    await trx.commit();
    
    // 10. Mengirim respons sukses ke client
      return successResponse(
        res,
        201,
        "success",
        "User berhasil dibuat",
        false,
        null,
        responsePayload
      );

  } catch (error) {
    await trx.rollback();
   // TAMBAHKAN BARIS INI UNTUK MELIHAT DETAIL ERROR
      console.log("===== ERROR DETAIL =====");
      console.log(error);
      console.log("========================");

      // Hapus file yang terlanjur di-upload jika ada error
      if (newFileAbsPath) {
        await safeUnlink(newFileAbsPath);
      }

      // 12. Menangani error spesifik (seperti email/username duplikat)
      if (error instanceof Sequelize.UniqueConstraintError) {
        const field = error.errors[0]?.path;
        let message = "Data sudah terdaftar.";
        if (field === "email") message = "Email sudah terdaftar.";
        if (field === "username") message = "Username sudah terdaftar.";
        return errorResponse(res, 409, "error", message, false, null, null);
      }

      // 13. Mengirim respons error umum
      return errorResponse(
        res,
        400,
        "error",
        error.message || "Gagal membuat user.",
        false,
        null,
        null
      );
    }
  };

  // ===================================================
  // PUT/PATCH: update user (by admin)
  // ===================================================
  // export const updateUser = async (req, res) => {
  //   const trx = await db.transaction();
  //   let newFileAbsPath = null;

  //   try {
  //     const { id } = req.params;
  //     const { username, full_name, whatsapp_number, password, email, role_id, isActive, subscription } = req.body;

  //     const user = await GetDataById(id, { transaction: trx, lock: trx.LOCK.UPDATE });
  //     if (!user) {
  //       await trx.rollback();
  //       return errorResponse(res, 404, 'error', 'User not found', false, null, null);
  //     }

  //     const hashed = password ? await bcrypt.hash(String(password), 12) : undefined;

  //     // simpan nilai lama agar bisa hapus file lama setelah commit
  //     const oldRel = user.profilePicture;

  //     const payload = {
  //       username: username ?? user.username,
  //       full_name: full_name ?? user.full_name,
  //       whatsapp_number: whatsapp_number ?? user.whatsapp_number,
  //       email: email ?? user.email,
  //       password: hashed ?? user.password,
  //       role_id: role_id ?? user.role_id,
  //       isActive: typeof isActive === 'undefined' ? user.isActive : isActive,
  //       subscription: typeof subscription === 'undefined' ? user.subscription : subscription,
  //       profilePicture: oldRel // default tetap yg lama, ganti kalau ada file baru
  //     };

  //     if (req.file) {
  //       newFileAbsPath = req.file.path;
  //       const newRel = relFromPublic(req.file.path);
  //       payload.profilePicture = newRel; // replace dengan rel baru
  //     }

  //     const updatedUser = await UpdateData(trx, id, payload);

  //     await trx.commit();

  //     // Hapus file lama setelah commit bila ada file baru
  //     if (req.file && oldRel) {
  //       // oldRel relative => absolute path
  //       const oldAbs = path.join(process.cwd(), 'public', oldRel.replace(/^\//, ''));
  //       await safeUnlink(oldAbs);
  //     }

  //     return successResponse(
  //       res,
  //       200,
  //       'success',
  //       'User updated successfully',
  //       false,
  //       null,
  //       {
  //         id: updatedUser.id,
  //         full_name: updatedUser.full_name,
  //         username: updatedUser.username,
  //         whatsapp_number: updatedUser.whatsapp_number,
  //         email: updatedUser.email,
  //         isActive: updatedUser.isActive,
  //         subscription: updatedUser.subscription,
  //         profilePicture: updatedUser.profilePicture ? buildPublicUrl(updatedUser.profilePicture) : null,
  //         updatedAt: updatedUser.updatedAt
  //       }
  //     );
  //   } catch (error) {
  //     await trx.rollback();
  //     if (newFileAbsPath) await safeUnlink(newFileAbsPath);

  //     if (error instanceof Sequelize.UniqueConstraintError) {
  //       return errorResponse(res, 409, 'error', 'Email atau username sudah terdaftar.', false, null, null);
  //     }
  //     return errorResponse(res, 400, 'error', error.message, false, null, null);
  //   }
  // };

  export const updateUser = async (req, res) => {
    const trx = await db.transaction();
    let newFileAbsPath = null;
    let oldRel = null;

    try {
      const { id } = req.params;
      const {
        username,
        full_name,
        whatsapp_number,
        password,
        email,
        role_id,
        isActive,
        subscription,
        force_logout,
      } = req.body;

      // Langkah 1: Cari dan kunci baris di tabel 'users' SAJA (tanpa include)
      const user = await User.findOne({
        where: { id },
        transaction: trx,
        lock: true, // Opsi lock yang lebih sederhana dan aman
      });

      if (!user) {
        throw new Error("User not found");
      }

      const hashed = password
        ? await bcrypt.hash(String(password), 12)
        : undefined;
      oldRel = user.profilePicture; // Simpan path file lama

      const payload = {
        username: username ?? user.username,
        full_name: full_name ?? user.full_name,
        whatsapp_number: whatsapp_number ?? user.whatsapp_number,
        email: email ?? user.email,
        password: hashed ?? user.password,
        role_id: role_id ?? user.role_id,
        isActive: typeof isActive === "undefined" ? user.isActive : isActive,
        subscription:
          typeof subscription === "undefined" ? user.subscription : subscription,
        profilePicture: oldRel,
      };

      if (req.file) {
        newFileAbsPath = req.file.path;
        payload.profilePicture = relFromPublic(req.file.path);
      }
      if (force_logout === true || String(force_logout) === "true") {
        payload.refresh_token = null;
      }

      // Langkah 2: Lakukan update
      await user.update(payload, { transaction: trx });

      // Langkah 3: Commit transaksi
      await trx.commit();

      // Hapus file lama setelah commit berhasil
      if (req.file && oldRel) {
        const oldAbs = path.join(
          process.cwd(),
          "public",
          oldRel.replace(/^\//, "")
        );
        await safeUnlink(oldAbs);
      }

      // Langkah 4: Ambil data terbaru yang lengkap (dengan role) untuk respons
      const updatedUserWithRole = await GetDataById(id);

      return successResponse(
        res,
        200,
        "success",
        "User updated successfully",
        false,
        null,
        updatedUserWithRole // Kirim data yang sudah lengkap dengan join
      );
    } catch (error) {
      await trx.rollback();
      if (newFileAbsPath) await safeUnlink(newFileAbsPath);

      if (error instanceof Sequelize.UniqueConstraintError) {
        return errorResponse(
          res,
          409,
          "error",
          "Email atau username sudah terdaftar.",
          false,
          null,
          null
        );
      }
      return errorResponse(res, 400, "error", error.message, false, null, null);
    }
  };

  // ===================================================
  // DELETE: user
  // ===================================================
  // export const deleteUser = async (req, res) => {
  //   const trx = await db.transaction();
  //   try {
  //     const { id } = req.params;

  //     const user = await User.findByPk(id, { transaction: trx, lock: trx.LOCK.UPDATE });
  //     if (!user) {
  //       await trx.rollback();
  //       return errorResponse(res, 404, 'error', 'User not found', false, null, null);
  //     }

  //     const oldRel = user.profilePicture; // relative path disimpan
  //     await user.destroy({ transaction: trx, force: true });
  //     await trx.commit();

  //     // Hapus file setelah commit
  //     if (oldRel) {
  //       const oldAbs = path.join(process.cwd(), 'public', oldRel.replace(/^\//, ''));
  //       await safeUnlink(oldAbs);
  //     }

  //     return successResponse(res, 200, 'success', 'User deleted successfully', false, null, null);
  //   } catch (error) {
  //     await trx.rollback();
  //     return errorResponse(res, 400, 'error', error.message, false, null, null);
  //   }
  // };

  export const deleteUser = async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;

      // Langkah 1: Cari dan kunci user di tabel 'users' SAJA
      const user = await User.findOne({
        where: { id },
        transaction: trx,
        lock: true,
      });

      if (!user) {
        throw new Error("User not found");
      }

      const oldRel = user.profilePicture;

      // Langkah 2: Hapus data
      await user.destroy({ transaction: trx, force: true });

      // Langkah 3: Commit transaksi
      await trx.commit();

      // Hapus file setelah commit
      if (oldRel) {
        const oldAbs = path.join(
          process.cwd(),
          "public",
          oldRel.replace(/^\//, "")
        );
        await safeUnlink(oldAbs);
      }

      return successResponse(
        res,
        200,
        "success",
        "User deleted successfully",
        false,
        null,
        null
      );
    } catch (error) {
      await trx.rollback();
      return errorResponse(res, 400, "error", error.message, false, null, null);
    }
  };

  // // ===================================================
  // // PATCH: update profile (user sendiri)
  // // ===================================================
  // export const updateMyProfile = async (req, res) => {
  //   const trx = await db.transaction();
  //   let newFileAbsPath = null;

  //   try {
  //     const userId = req.user?.id;
  //     if (!userId) {
  //       await trx.rollback();
  //       return errorResponse(
  //         res,
  //         401,
  //         "error",
  //         "Unauthorized",
  //         false,
  //         null,
  //         null
  //       );
  //     }

  //     const { full_name, whatsapp_number } = req.body;

  //     const user = await User.findByPk(userId, {
  //       transaction: trx,
  //       lock: trx.LOCK.UPDATE,
  //     });
  //     if (!user) {
  //       await trx.rollback();
  //       return errorResponse(
  //         res,
  //         404,
  //         "error",
  //         "User not found",
  //         false,
  //         null,
  //         null
  //       );
  //     }

  //     const payload = {};
  //     if (typeof full_name !== "undefined") payload.full_name = full_name;
  //     if (typeof whatsapp_number !== "undefined")
  //       payload.whatsapp_number = whatsapp_number;

  //     const oldRel = user.profilePicture;

  //     if (req.file) {
  //       newFileAbsPath = req.file.path;
  //       const newRel = relFromPublic(newFileAbsPath);
  //       payload.profilePicture = newRel; // simpan REL
  //     }

  //     await user.update(payload, { transaction: trx });
  //     await trx.commit();

  //     // Hapus file lama setelah commit bila ada file baru
  //     if (req.file && oldRel) {
  //       const oldAbs = path.join(
  //         process.cwd(),
  //         "public",
  //         oldRel.replace(/^\//, "")
  //       );
  //       await safeUnlink(oldAbs);
  //     }

  //     return successResponse(
  //       res,
  //       200,
  //       "success",
  //       "Profile updated",
  //       false,
  //       null,
  //       {
  //         id: user.id,
  //         full_name: user.full_name,
  //         username: user.username,
  //         whatsapp_number: user.whatsapp_number,
  //         email: user.email,
  //         profilePicture: user.profilePicture
  //           ? buildPublicUrl(user.profilePicture)
  //           : null,
  //         updatedAt: user.updatedAt,
  //       }
  //     );
  //   } catch (error) {
  //     await trx.rollback();
  //     if (newFileAbsPath) await safeUnlink(newFileAbsPath);
  //     return errorResponse(res, 400, "error", error.message, false, null, null);
  //   }
  // };
  export const updateMyProfile = async (req, res) => {
    const trx = await db.transaction();
    let newFileAbsPath = null;
    let oldRel = null;

    try {
      // Ambil ID user dari token yang sudah divalidasi oleh middleware verifyToken
      const userId = req.user?.id;
      if (!userId) {
        throw new Error("User ID tidak ditemukan dari token autentikasi.");
      }

      // Ambil semua data yang mungkin diubah dari form
       const {
      full_name,
      username,
      whatsapp_number,
      email,
      password, // Ini adalah password BARU
      currentPassword // Ini adalah password LAMA
    } = req.body;

      const user = await User.findByPk(userId, {
        transaction: trx,
        lock: true
      });

      if (!user) {
        throw new Error("User tidak ditemukan.");
      }

      // Siapkan payload untuk diupdate
      const payload = {};
      if (full_name) payload.full_name = full_name;
      if (username) payload.username = username;
      if (whatsapp_number) payload.whatsapp_number = whatsapp_number;
      if (email) payload.email = email;
      if (password && currentPassword) {
        // 1. Validasi password lama
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            // Jika password lama salah, lempar error
            throw new Error("Password lama yang Anda masukkan salah.");
        }

        // 2. Jika password lama benar, hash password baru
        payload.password = await bcrypt.hash(String(password), 12);
    } else if (password && !currentPassword) {
        // Jika user mengisi password baru TAPI tidak mengisi password lama
        throw new Error("Untuk mengubah password, Anda harus memasukkan password lama.");
    }

      oldRel = user.profilePicture;

      // Handle upload file baru
      if (req.file) {
        newFileAbsPath = req.file.path;
        payload.profilePicture = relFromPublic(newFileAbsPath);
      }

      // Lakukan update jika ada data yang diubah
      if (Object.keys(payload).length > 0) {
        await user.update(payload, { transaction: trx });
      }

      await trx.commit();

      // Hapus file lama setelah commit berhasil
      if (req.file && oldRel) {
        const oldAbs = path.join(process.cwd(), 'public', oldRel.replace(/^\//, ''));
        await safeUnlink(oldAbs);
      }
      
      // Ambil data user terbaru yang lengkap (dengan role, dll) untuk dikirim balik
      const updatedUser = await GetDataById(userId);
      // BUAT OBJEK RESPONS BARU YANG STRUKTURNYA SAMA DENGAN RESPONS LOGIN
      const responsePayload = {
          id: updatedUser.id,
          full_name: updatedUser.full_name,
          username: updatedUser.username,
          email: updatedUser.email,
          whatsapp_number: updatedUser.whatsapp_number,
          subscription: updatedUser.subscription,
          // Panggil helper 'buildPublicUrl' agar formatnya sama dengan login
          avatarUrl: updatedUser.profilePicture ? buildPublicUrl(updatedUser.profilePicture) : null,
          role: updatedUser.role,
          accessLevels: updatedUser.role.accessLevels, // Jika Anda mengirim ini saat login
      };
      return successResponse(
        res,
        200,
        'success',
        'Profil berhasil diperbarui',
        false,
        null,
        responsePayload // Kirim data user yang sudah diupdate
      );

    } catch (error) {
      await trx.rollback();
      if (newFileAbsPath) await safeUnlink(newFileAbsPath);

      if (error instanceof Sequelize.UniqueConstraintError) {
          return errorResponse(res, 409, 'error', 'Email atau username sudah terdaftar.', false, null, null);
      }
      return errorResponse(res, 400, 'error', error.message, false, null, null);
    }
  };


  // ===================================================
  // PATCH: toggle user status
  // ===================================================
  export const toggleUserStatus = async (req, res) => {
    const trx = await db.transaction();
    try {
      const { id } = req.params;
      const { isActive } = req.body; // Input boolean dari frontend (misal: true)

      if (typeof isActive !== 'boolean') {
        throw new Error("Input 'isActive' harus boolean (true/false).");
      }

      const user = await User.findOne({ where: { id }, transaction: trx });
      if (!user) {
        throw new Error("User tidak ditemukan.");
      }

      // --- LOGIKA BARU: Terjemahkan boolean ke status string ---
      // 1. Tentukan status baru berdasarkan input boolean dari frontend.
      // Jika frontend mengirim true, set status ke 'confirmed'.
      // Jika frontend mengirim false, set status ke 'pending'.
      // Kita asumsikan toggle ini tidak untuk 'banned'.
      
      let newStatus;
      if (isActive === true) {
          newStatus = 'confirmed';
      } else {
          // Hanya ubah ke pending jika status saat ini confirmed.
          // Jangan ubah status 'banned' menjadi 'pending' melalui toggle biasa.
          if (user.status === 'confirmed') {
              newStatus = 'pending';
          } else {
              // Jika status sudah pending atau banned, biarkan saja.
              newStatus = user.status;
          }
      }

      // 2. Update HANYA kolom 'status'. Hook di model akan mengurus kolom 'isActive'.
      await user.update({ status: newStatus }, { transaction: trx });
      await trx.commit();

      return successResponse(res, 200, "success", "Status user berhasil diperbarui.");

    } catch (error) {
      await trx.rollback();
      return errorResponse(res, 400, "error", error.message);
    }
  }; 


  export const banUser = async (req, res) => {
      const userId = req.params.id;
      const user = await User.findByPk(userId);
      if (user) {
          user.status = 'banned';
          await user.save(); // Hook akan otomatis mengubah user.isActive menjadi false
          res.json({ message: "User berhasil dibanned." });
      } else {
          res.status(404).json({ message: "User tidak ditemukan." });
      }
  };
