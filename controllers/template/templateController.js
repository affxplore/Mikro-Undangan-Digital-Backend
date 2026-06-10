import db from "../../config/database.js";
import {
  templateResponse,
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
} from "../../models/template.js";
import Template from "../../models/template.js";
import { Project } from "../../models/index.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { relFromPublic, safeUnlink } from "../../helpers/files.js";
import path from "path";

export const getAllTemplates = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, filter } = req.query;

    let parsedFilter = {};
    if (typeof filter === "string") {
      try { 
        parsedFilter = JSON.parse(filter); 
      } catch (e) {
        console.log("❌ [Controller] Filter parsing error:", e.message);
      }
    } else if (typeof filter === 'object' && filter !== null) {
      parsedFilter = filter;
    }

    const pagination = { 
      page: parseInt(page), 
      limit: parseInt(limit),
      sort: typeof sort === "string" ? sort : undefined,
    };
    
    const result = await GetDataList(pagination, parsedFilter);
    
    // result sudah berisi pagination info dan data yang sudah di-format
    successResponse(res, 200, "success", "Templates retrieved successfully", true, result.pagination, result.rows);
  } catch (error) {
    console.error("❌ [Controller] Error in getAllTemplates:", error);
    errorResponse(res, 500, "error", error.message);
  }
};

/**
 * Mengambil daftar template berdasarkan ID kategori tertentu
 * Digunakan saat admin mengklik nama kategori untuk melihat template terkait
 */
export const getTemplatesByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Filter spesifik untuk category_id
    const filter = {
      category_id: parseInt(id)
    };

    // Set limit tinggi agar semua template di kategori tersebut muncul
    const pagination = {
      page: 1,
      limit: 100 
    };

    const result = await GetDataList(pagination, filter);

    // Cek jika datanya kosong
    if (!result || !result.rows || result.rows.length === 0) {
      return successResponse(res, 200, "success", "Tidak ada template untuk kategori ini", false, null, []);
    }

    // Format data agar path gambar/file menjadi URL publik yang benar
    const formattedData = result.rows.map(item => templateResponse(item));

    return successResponse(
      res, 
      200, 
      "success", 
      `Berhasil mengambil template untuk kategori ID: ${id}`, 
      false, 
      null, 
      formattedData
    );
  } catch (error) {
    console.error("❌ [Controller] Error in getTemplatesByCategory:", error);
    return errorResponse(res, 500, "error", error.message);
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await GetDataById(req.params.id);
    if (!template) {
      return errorResponse(res, 404, "error", "Template tidak ditemukan.");
    }
    return successResponse(res, 200, "success", "Template berhasil ditemukan", false, null, templateResponse(template));
  } catch (error) {
    errorResponse(res, 500, "error", error.message);
  }
};

export const createTemplate = async (req, res) => {
  console.log("📝 [CREATE Template] Request received:");
  console.log("📝 [CREATE Template] Body:", req.body);
  console.log("📝 [CREATE Template] Files:", req.files);
  console.log("📝 [CREATE Template] Headers:", req.headers['content-type']);

  const trx = await db.transaction();
  
  // Variabel untuk menampung template yang baru dibuat
  let newTemplate; 
  
  try {
    const { title, label, category_id, description, schema } = req.body;
    
    console.log("📝 [CREATE Template] Extracted data:", {
      title,
      label, 
      category_id,
      description
    });
    
    if (!title || !category_id) {
      throw new Error("Title dan Category ID wajib diisi.");
    }

    const payload = { 
      title, 
      category_id: parseInt(category_id), 
      label: label || null, 
      description: description || null,
      // Pastikan schema masuk sebagai string jika database bertipe TEXT
      // Atau biarkan sebagai objek jika database bertipe JSON/JSONB
      schema: typeof schema === 'object' ? JSON.stringify(schema) : schema
    };
    
    console.log("📝 [CREATE Template] Payload before files:", payload);
    
    // 3. Proses file yang diupload
    if (req.files) {
      console.log("📝 [CREATE Template] Processing files:", Object.keys(req.files));
      
      if (req.files.thumbnail_file) {
        payload.thumbnail_file = relFromPublic(req.files.thumbnail_file[0].path);
        console.log("📝 [CREATE Template] Added thumbnail_file:", payload.thumbnail_file);
        
        // Jika thumbnail_file adalah gambar, kita juga bisa menggunakannya sebagai thumbnail_image
        if (req.files.thumbnail_file[0].mimetype.startsWith('image/')) {
          payload.thumbnail_image = payload.thumbnail_file;
          console.log("📝 [CREATE Template] Auto-set thumbnail_image from file");
        }
      }
      // Jika thumbnail_image diupload secara terpisah, akan menimpa nilai sebelumnya
      if (req.files.thumbnail_image) {
        payload.thumbnail_image = relFromPublic(req.files.thumbnail_image[0].path);
        console.log("📝 [CREATE Template] Added thumbnail_image:", payload.thumbnail_image);
      }
    }
    
    console.log("📝 [CREATE Template] Final payload:", payload);
    
    // 1. Buat data di dalam transaksi
    newTemplate = await CreateData(payload, trx);
    
    // 2. Selesaikan transaksi
    await trx.commit();

    // Ambil data terbaru untuk response
    const responseData = await GetDataById(newTemplate.id);
    return successResponse(res, 201, "success", "Template berhasil dibuat", false, null, templateResponse(responseData));

  } catch (error) {
    console.error("❌ [CREATE Template] Error:", error);
    if (trx) await trx.rollback();

    if (req.files) {
      const allFiles = [...CreateData(req.files.thumbnail_file || []), ...CreateData(req.file.thumbnail_image || [])];
      for (const f of allFiles) {
        await safeUnlink(f.path);
      }
    }

    return errorResponse(res, 400, "error", error.message);
  }
  
  // 3. SETELAH transaksi berhasil, ambil data lengkap untuk respons
  try {
    const responseData = await GetDataById(newTemplate.id);
    successResponse(res, 201, "success", "Template berhasil dibuat", false, null, templateResponse(responseData));
  } catch (error) {
    // Menangani kasus jika pengambilan data setelah create gagal
    errorResponse(res, 201, "success", "Template berhasil dibuat, tetapi gagal mengambil data terbaru.", false, null, { id: newTemplate.id });
  }
};

// export const createTemplate = async (req, res) => {
//   const trx = await db.transaction();
//   let newFileAbsPath = null;
//   try {
//     const { title, label, category_id, description } = req.body;
//     if (!title || !category_id) {
//       throw new Error("Title dan Category ID wajib diisi.");
//     }
//     const payload = { title, label, category_id: parseInt(category_id), description };

//     if (req.file) {
//       newFileAbsPath = req.file.path;
//       payload.thumbnail_file = relFromPublic(newFileAbsPath);
//     }

//     const newTemplate = await CreateData(payload, trx);
    
//     // Ambil kembali data lengkap dengan relasi
//     const responseData = await GetDataById(newTemplate.id, { transaction: trx });
    
//     await trx.commit();
//     successResponse(res, 201, "success", "Template berhasil dibuat", false, null, templateResponse(responseData));
//   } catch (error) {
//     if (newFileAbsPath) await safeUnlink(newFileAbsPath);
//     await trx.rollback();
//     errorResponse(res, 400, "error", error.message);
//   }
// };

export const updateTemplate = async (req, res) => {
  const trx = await db.transaction();
  const newFiles = []; // To store paths of newly uploaded files for potential cleanup

  try {
    const { id } = req.params;
    console.log("BODY DITERIMA:", req.body);

    // 1. Pastikan mengambil field secara eksplisit dari req.body
    const { title, category_id, label, description, schema } = req.body;
    // 2. Susun payload secara manual agar lebih terkontrol
    const payload = {};
    if (title) payload.title = title;
    if (category_id) payload.category_id = parseInt(category_id);
    if (label !== undefined) payload.label = label || null;
    if (description !== undefined) payload.description = description || null;
    
    // Validasi & Parsing Schema (Kunci agar desain tersimpan)
    if (schema) {
      try {
      payload.schema = typeof schema === 'object' ? JSON.stringify(schema) : schema;
    } catch (e) {
      payload.schema = schema;
    }
  }

    if (Object.keys(payload).length === 0 && (!req.files || Object.keys(req.files).length === 0)) {
      throw new Error("Tidak ada data yang diubah.");
    }

    const oldTemplate = await GetDataById(id);
    if (!oldTemplate) {
      throw new Error("Template tidak ditemukan.");
    }

    const oldFilePaths = [];

    // Process thumbnail_file if it exists
    if (req.files && req.files.thumbnail_file) {
      const newFilePath = req.files.thumbnail_file[0].path;
      newFiles.push(newFilePath);
      payload.thumbnail_file = relFromPublic(newFilePath);
      
      // Jika thumbnail_file adalah gambar, kita juga bisa menggunakannya sebagai thumbnail_image
      if (req.files.thumbnail_file[0].mimetype.startsWith('image/')) {
        payload.thumbnail_image = payload.thumbnail_file;
      }
      
      if (oldTemplate.thumbnail_file) {
        oldFilePaths.push(path.join(process.cwd(), 'public', oldTemplate.thumbnail_file.replace(/^\//, '')));
      }
    }

    // Process thumbnail_image if it exists (akan menimpa thumbnail_image yang mungkin diset dari thumbnail_file)
    if (req.files && req.files.thumbnail_image) {
      const newImagePath = req.files.thumbnail_image[0].path;
      newFiles.push(newImagePath);
      payload.thumbnail_image = relFromPublic(newImagePath);
      if (oldTemplate.thumbnail_image && oldTemplate.thumbnail_image !== oldTemplate.thumbnail_file) {
        // Hanya hapus thumbnail_image lama jika berbeda dengan thumbnail_file
        oldFilePaths.push(path.join(process.cwd(), 'public', oldTemplate.thumbnail_image.replace(/^\//, '')));
      }
    }

    // DEBUG: Pastikan 'schema' ada di sini sebelum update
    console.log("🔥 [FINAL PAYLOAD TO UPDATE]:", Object.keys(payload));

    const templateInstance = await Template.findByPk(id, { transaction: trx });
    if (!templateInstance) throw new Error("Template tidak ditemukan");

    // Set data secara manual satu per satu
    templateInstance.set(payload); 

    // Paksa simpan kolom schema secara eksplisit
    await templateInstance.save({ 
    transaction: trx,
    fields: ['title', 'label', 'description', 'category_id', 'schema', 'thumbnail_file', 'thumbnail_image'] 
  });
    
    await trx.commit();

    // After commit, delete old files
    for (const oldPath of oldFilePaths) {
      await safeUnlink(oldPath);
    }

    // Get fresh data for response AFTER everything is done
    const responseData = await GetDataById(id);
    return successResponse(res, 200, "success", "Template berhasil diperbarui", false, null, templateResponse(responseData));
  } catch (error) {
    if (trx) await trx.rollback();
    // If transaction fails, delete newly uploaded files
    for (const filePath of newFiles) {
      await safeUnlink(filePath);
    }
    
    console.error("❌ Update Error:", error);
    return errorResponse(res, 400, "error", error.message);
  }
};

export const deleteTemplate = async (req, res) => {
  console.log("🗑️ [DELETE Template] User attempting delete:", {
    userId: req.user?.id,
    userRole: req.user?.role,
    templateId: req.params.id
  });

  const trx = await db.transaction();
  try {
    const { id } = req.params;
    
    // Cek apakah template masih digunakan oleh project
    const projectCount = await Project.count({
      where: { template_id: id },
      transaction: trx
  });
    // const { count } = await db.query(
    //   'SELECT COUNT(*) as count FROM projects WHERE template_id = :templateId',
    //   {
    //     replacements: { templateId: id },
    //     type: db.QueryTypes.SELECT,
    //     transaction: trx
    //   }
    // );

    // const projectCount = parseInt(count[0]?.count || 0);
    
    if (projectCount > 0) {
      await trx.rollback();
      return errorResponse(
        res,
        400,
        "error",
        `Template ini tidak dapat dihapus karena masih digunakan oleh ${projectCount} undangan/project aktif. Harap hapus atau ganti template pada undangan tersebut terlebih dahulu sebelum menghapus template ini.`,
        false,
        null,
        { projectCount }
      );
    }
    
    const result = await DeleteData(id, trx);
    
    // FIX BUG #5a: property yang benar adalah 'deletedFiles', bukan 'deletedFilePath'
    if (result.deletedFiles) {
      if (result.deletedFiles.thumbnail_file) {
        const absPath = path.join(
          process.cwd(), 'public',
          result.deletedFiles.thumbnail_file.replace(/^\//, '')
        );
        await safeUnlink(absPath);
      }
      if (result.deletedFiles.thumbnail_image) {
        const absPath = path.join(
          process.cwd(), 'public',
          result.deletedFiles.thumbnail_image.replace(/^\//, '')
        );
        await safeUnlink(absPath);
      }
    }
    await trx.commit();
    console.log("✅ [DELETE Template] Success for template ID:", id);
    successResponse(res, 200, "success", "Template berhasil dihapus");
  } catch (error) {
    console.error("❌ [DELETE Template] Error:", error);
    await trx.rollback();
    
    // Handle foreign key constraint error dengan pesan yang lebih user-friendly
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return errorResponse(
        res, 
        400, 
        "error", 
        "Template tidak dapat dihapus karena masih digunakan oleh project lain. Hapus atau ubah template pada project tersebut terlebih dahulu."
      );
    }
    
    errorResponse(res, 400, "error", error.message || "Terjadi kesalahan saat menghapus template");
  }
};