// import db from "../../config/database.js";
// import {
//   categoryResponse,
//   CreateData,
//   DeleteData,
//   GetDataList,
//   GetDataById,
//   UpdateData,
// } from "../../models/category.js";
// import Category from "../../models/category.js";
// import { successResponse, errorResponse } from "../../helpers/response.js";
// import { calculatePagination } from "../../helpers/paginate.js";
// import {
//   buildPublicUrl,
//   relFromPublic,
//   safeUnlink,
// } from "../../helpers/files.js";
// import path from "path";
// import { Sequelize } from "sequelize";

// // GET /categories -> Mengambil daftar kategori dengan paginasi, pencarian, dan pengurutan
// export const getAllCategories = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, sort, filter } = req.query;

//     // filter bisa dikirim sebagai JSON string di query
//     let parsedFilter = {};
//     if (typeof filter === "string") {
//       try {
//         parsedFilter = JSON.parse(filter);
//       } catch {
//         parsedFilter = {};
//       }
//     } else if (typeof filter === "object" && filter !== null) {
//       parsedFilter = filter;
//     }

//     const pagination = {
//       page: parseInt(page, 10),
//       limit: parseInt(limit, 10),
//       sort: typeof sort === "string" ? sort : undefined,
//     };

//     const result = await GetDataList(pagination, parsedFilter);
//     const paginationData = calculatePagination(pagination, result.totalRows);

//     // Map profilePicture (relative) -> public URL

//     const withUrls = result.categoryList.map((u) => {
//       const plainCategory = u.get({ plain: true });
   

//       return {
//         ...plainCategory,
//         img_icon: u.img_icon ? buildPublicUrl(u.img_icon) : null,
//       };
//     });

//     successResponse(
//       res,
//       200,
//       "success",
//       "Categories retrieved successfully",
//       true,
//       paginationData,
//       withUrls
//     );
//   } catch (error) {
//     errorResponse(
//       res,
//       400,
//       "error",
//       error.message || "Failed to retrieve categories",
//       false,
//       null,
//       null
//     );
//   }
// };

// // // GET /categories/:id -> Mengambil satu kategori berdasarkan ID
// export const getCategoryById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const category = await GetDataById(id);

//     if (!category) {
//       return errorResponse(
//         res,
//         404,
//         "error",
//         "Category not found",
//         false,
//         null,
//         null
//       );
//     }

//     const payload = {
//       ...category.get({ plain: true }),
//       img_icon: category.img_icon ? buildPublicUrl(category.img_icon) : null,
//     };
//     delete payload.password;
//     successResponse(
//       res,
//       200,
//       "success",
//       "Category retrieved successfully",
//       false,
//       null,
//       payload
//     );
//   } catch (error) {
//     errorResponse(res, 400, "error", error.message, false, null, null);
//   }
// };

// // POST /categories -> Membuat kategori baru
// export const createCategory = async (req, res) => {
//   // 1. Memulai transaksi database
//   const trx = await db.transaction();
//   let newFileAbsPath = null;

//   try {
//     // 2. Mengambil dan memvalidasi data dari request body
//     let { name } = req.body;

//     if (!name) {
//       throw new Error("Nama kategori wajib diisi.");
//     }

//     // 5. Menangani upload file gambar kategori
//     let imgIconRel = null;
//     if (req.file) {
//       newFileAbsPath = req.file.path;
//       imgIconRel = relFromPublic(req.file.path);

//       // ================== TAMBAHKAN LOG DI SINI ==================
//       console.log("--- DEBUG FILE UPLOAD ---");
//       console.log("1. Objek req.file dari Multer:", req.file);
//       console.log(
//         "2. Path Absolut (Input untuk relFromPublic):",
//         newFileAbsPath
//       );

//       imgIconRel = relFromPublic(req.file.path);

//       console.log("3. Path Relatif (Output dari relFromPublic):", imgIconRel);
//       console.log("--------------------------");
//       // ==========================================================
//     }
//     // 6. Mempersiapkan payload data untuk disimpan ke database
//     const payload = {
//       name,
//       img_icon: imgIconRel,
//     };

//     // TAMBAHKAN BARIS INI UNTUK DEBUG
//     console.log("PAYLOAD YANG AKAN DISIMPAN:", payload);

//     // 7. Menyimpan data ke database menggunakan fungsi dari model
//     const created = await CreateData(trx, payload);

//     // 8. Mempersiapkan data yang akan dikirim sebagai respons
//     // Ini dilakukan sebelum commit untuk menangkap error jika ada
//     const responsePayload = {
//       id: created.id,
//       name: created.name,
//       img_icon: created.img_icon ? buildPublicUrl(created.img_icon) : null,
//       // Jika Anda tidak menggunakan timestamps, hapus baris createdAt
//       // createdAt: created.createdAt
//     };

//     // 9. Commit transaksi HANYA JIKA semua langkah di atas berhasil
//     await trx.commit();

//     // 10. Mengirim respons sukses ke client
//     return successResponse(
//       res,
//       201,
//       "success",
//       "Kategori berhasil dibuat",
//       false,
//       null,
//       responsePayload
//     );
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
//       if (field === "name") message = "Nama kategori sudah terdaftar.";
//       return errorResponse(res, 409, "error", message, false, null, null);
//     }

//     // 13. Mengirim respons error umum
//     return errorResponse(
//       res,
//       400,
//       "error",
//       error.message || "Gagal membuat kategori.",
//       false,
//       null,
//       null
//     );
//   }
// };

// // // PUT /categories/:id -> Memperbarui kategori
// export const updateCategory = async (req, res) => {
//   const trx = await db.transaction();
//   let newFileAbsPath = null;
//   let oldRel = null;

//   try {
//     const { id } = req.params;
//     const { name } = req.body;

//     // Langkah 1: Cari dan kunci baris di tabel 'categories' SAJA (tanpa include)
//     const category = await Category.findOne({
//       where: { id },
//       transaction: trx,
//       lock: true, // Opsi lock yang lebih sederhana dan aman
//     });

//     if (!category) {
//       throw new Error("Category not found");
//     }

//     oldRel = category.img_icon; // Simpan path file lama

//     const payload = {
//       name: name ?? category.name,
//       img_icon: oldRel,
//     };

//     if (req.file) {
//       newFileAbsPath = req.file.path;
//       payload.img_icon = relFromPublic(req.file.path);
//     }
//     // Langkah 2: Lakukan update
//     await category.update(payload, { transaction: trx });

//     // Langkah 3: Commit transaksi
//     await trx.commit();

//     // Hapus file lama setelah commit berhasil
//     if (req.file && oldRel) {
//       const oldAbs = path.join(
//         process.cwd(),
//         "public",
//         oldRel.replace(/^\//, "")
//       );
//       await safeUnlink(oldAbs);
//     }

//     // Langkah 4: Ambil data terbaru yang lengkap (dengan role) untuk respons
//     const updatedCategory = await GetDataById(id);

//     return successResponse(
//       res,
//       200,
//       "success",
//       "Category updated successfully",
//       false,
//       null,
//       updatedCategory // Kirim data yang sudah lengkap dengan join
//     );
//   } catch (error) {
//     await trx.rollback();
//     if (newFileAbsPath) await safeUnlink(newFileAbsPath);

//     if (error instanceof Sequelize.UniqueConstraintError) {
//       return errorResponse(
//         res,
//         409,
//         "error",
//         "Nama kategori sudah terdaftar.",
//         false,
//         null,
//         null
//       );
//     }
//     return errorResponse(res, 400, "error", error.message, false, null, null);
//   }
// };

// // DELETE /categories/:id -> Menghapus kategori
// export const deleteCategory = async (req, res) => {
//   const trx = await db.transaction();
//   try {
//     const { id } = req.params;

//     // Langkah 1: Cari dan kunci kategori di tabel 'categories' SAJA
//     const category = await Category.findOne({
//       where: { id },
//       transaction: trx,
//       lock: true,
//     });

//     if (!category) {
//       throw new Error("Category not found");
//     }

//     const oldRel = category.img_icon;

//     // Langkah 2: Hapus data
//     await category.destroy({ transaction: trx, force: true });

//     // Langkah 3: Commit transaksi
//     await trx.commit();

//     // Hapus file setelah commit
//     if (oldRel) {
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
//       "Category deleted successfully",
//       false,
//       null,
//       null
//     );
//   } catch (error) {
//     await trx.rollback();
//     return errorResponse(res, 400, "error", error.message, false, null, null);
//   }
// };

import db from "../../config/database.js";
import {
  categoryResponse,
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
} from "../../models/category.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { buildPublicUrl, relFromPublic, safeUnlink } from "../../helpers/files.js";
import path from "path";
import { Sequelize } from "sequelize";

export const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, filter } = req.query;

    let parsedFilter = {};
    if (typeof filter === "string") {
      try { parsedFilter = JSON.parse(filter); } catch { parsedFilter = {}; }
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

    const withUrls = result.categoryList.map((cat) => {
      const plainCategory = cat.get({ plain: true });
      return {
        ...plainCategory,
        img_icon: cat.img_icon ? buildPublicUrl(cat.img_icon) : null,
      };
    });

    successResponse(res, 200, "success", "Categories retrieved successfully", true, paginationData, withUrls);
  } catch (error) {
    errorResponse(res, 400, "error", error.message || "Failed to retrieve categories");
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await GetDataById(id);

    if (!category) {
      return errorResponse(res, 404, "error", "Category not found");
    }
    
    const payload = {
      ...category.get({ plain: true }),
      img_icon: category.img_icon ? buildPublicUrl(category.img_icon) : null,
    };
    
    successResponse(res, 200, "success", "Category retrieved successfully", false, null, payload);
  } catch (error) {
    errorResponse(res, 400, "error", error.message);
  }
};

export const createCategory = async (req, res) => {
  const trx = await db.transaction();
  let newFileAbsPath = null;
  try {
    const { name } = req.body;
    if (!name) throw new Error("Nama kategori wajib diisi.");

    let imgIconRel = null;
    if (req.file) {
      newFileAbsPath = req.file.path;
      imgIconRel = relFromPublic(newFileAbsPath);
    }
    
    const payload = { name, img_icon: imgIconRel };
    const created = await CreateData(trx, payload);
    
    const responsePayload = {
      id: created.id,
      name: created.name,
      img_icon: created.img_icon ? buildPublicUrl(created.img_icon) : null,
    };

    await trx.commit();
    
    return successResponse(res, 201, "success", "Kategori berhasil dibuat", false, null, responsePayload);
  } catch (error) {
    await trx.rollback();
    if (newFileAbsPath) await safeUnlink(newFileAbsPath);

    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "error", "Nama kategori sudah terdaftar.");
    }
    return errorResponse(res, 400, "error", error.message || "Gagal membuat kategori.");
  }
};

export const updateCategory = async (req, res) => {
  const trx = await db.transaction();
  let newFileAbsPath = null;
  let oldRel = null;
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await GetDataById(id, { transaction: trx, lock: true });
    if (!category) throw new Error("Category not found");

    oldRel = category.img_icon;
    const payload = { 
      name: name ?? category.name,
      img_icon: oldRel 
    };

    if (req.file) {
      newFileAbsPath = req.file.path;
      payload.img_icon = relFromPublic(newFileAbsPath);
    }
    
    const updated = await UpdateData(trx, id, payload);
    await trx.commit();

    if (req.file && oldRel) {
      const oldAbs = path.join(process.cwd(), "public", oldRel.replace(/^\//, ""));
      await safeUnlink(oldAbs);
    }

    const updatedCategory = await GetDataById(id);

    return successResponse(res, 200, "success", "Category updated successfully", false, null, updatedCategory);
  } catch (error) {
    await trx.rollback();
    if (newFileAbsPath) await safeUnlink(newFileAbsPath);

    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "error", "Nama kategori sudah terdaftar.");
    }
    return errorResponse(res, 400, "error", error.message);
  }
};

export const deleteCategory = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const category = await GetDataById(id, { transaction: trx, lock: true });
    if (!category) throw new Error("Category not found");

    const oldRel = category.img_icon;
    await DeleteData(trx, id);
    await trx.commit();

    if (oldRel) {
      const oldAbs = path.join(process.cwd(), "public", oldRel.replace(/^\//, ""));
      await safeUnlink(oldAbs);
    }

    return successResponse(res, 200, "success", "Category deleted successfully");
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message);
  }
};