import db from "../../config/database.js";
import {
  systemContentResponse,
  CreateData,
  DeleteData,
  GetDataList, // Fungsi ini juga diimpor dari model yang benar
  UpdateData,
} from "../../models/systemContent.js"; // <-- PERBAIKAN: Path diubah ke file model yang benar
import SystemContent from "../../models/systemContent.js"; // <-- PERBAIKAN: Path diubah ke file model yang benar
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { Sequelize } from "sequelize";


export const getAllSystemContents = async (req, res) => {
  try {
    // --- PERBAIKAN 3: Struktur query yang lebih fleksibel ---
    const { page = 1, limit = 10, sort, filter } = req.query;

     console.log("[BACKEND-LOG] Filter yang diterima:", filter);

    let parsedFilter = {};
    if (typeof filter === "string") {
      try {
        // Frontend bisa mengirim filter sebagai JSON string: filter={"search":"abc", "status":"true"}
        parsedFilter = JSON.parse(filter);
      } catch (error) {
        console.error("Filter JSON tidak valid:", error);
        // Abaikan filter jika tidak valid
      }
    }

    const pagination = { page, limit, sort }; // <-- PERBAIKAN: Tambahkan 'sort' ke objek pagination
    
    const result = await GetDataList(pagination, parsedFilter);
    const paginationData = calculatePagination({ page, limit }, result.totalRows);
    // Hapus pemetaan ganda. `result.data` sudah diformat oleh model.
    const data = result.data;

    successResponse(
      res,
      200,
      "success",
      "Konten berhasil diambil",
      true,
      paginationData,
      data
    );
  } catch (error) {
    errorResponse(
      res,
      500, // Gunakan 500 untuk error server internal
      "error",
      "Gagal mengambil data konten", // Pesan error yang lebih deskriptif
      false,
      null,
      { message: error.message }
    );
  }
};

export const getDistinctTypes = async (req, res) => {
  try {
    const types = await SystemContent.findAll({
      attributes: [
        // Gunakan fungsi DISTINCT dari Sequelize/SQL
        [Sequelize.fn('DISTINCT', Sequelize.col('type')), 'type']
      ],
      raw: true, // Ambil hasil mentah agar lebih ringan
    });

    // Hasilnya akan berupa array of objects, kita ubah menjadi array of strings
    const typeList = types.map(item => item.type);

    successResponse(res, 200, "success", "Tipe konten berhasil diambil", false, null, typeList);
  } catch (error) {
    errorResponse(res, 500, "error", "Gagal mengambil tipe konten");
  }
};

// GET /system-contents/:id -> Mengambil satu konten berdasarkan ID
export const getSystemContentById = async (req, res) => {
  try {
    const content = await SystemContent.findByPk(req.params.id);
    if (!content) {
      return errorResponse(res, 404, "Error", "Konten tidak ditemukan.");
    }
    successResponse(res, 200, "success", "Konten berhasil ditemukan", false, null, systemContentResponse(content));
  } catch (error) {
    errorResponse(res, 500, "Error", error.message, false, null, null);
  }
};

// POST /system-contents -> Membuat konten baru
export const createSystemContent = async (req, res) => {
  const trx = await db.transaction();

  try {
    // Ambil field baru dari body
    const { key, title, type, isActive, content, config } = req.body;
    if (!key || !title || !type) {
      throw new Error("Field 'key', 'title', dan 'type' wajib diisi.");
    }

    // Masukkan field baru ke payload
    const payload = { key, title, type, isActive, content, config };

    const newContent = await CreateData(payload, trx);
    await trx.commit();

    successResponse(res, 201, "success", "Konten berhasil dibuat", false, null, systemContentResponse(newContent));
  } catch (error) {
    await trx.rollback();

    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "Error", "Key sudah ada, harus unik.");
    }
    errorResponse(res, 400, "Error", "Bad Request: ", error.message);
  }
};

// PUT /system-contents/:id -> Memperbarui konten
export const updateSystemContent = async (req, res) => {
  const trx = await db.transaction();

  try {
    const { id } = req.params;
    // Ambil field baru dari body
    const { key, title, type, isActive, content, config } = req.body;
    
    const existingContent = await SystemContent.findByPk(id);
    if (!existingContent) {
        await trx.rollback();
        return errorResponse(res, 404, "Error", "Konten tidak ditemukan.");
    }

    const payload = {};
    if (key) payload.key = key;
    if (title) payload.title = title;
    if (type) payload.type = type;
    if (isActive !== undefined) payload.isActive = isActive;
    // Tambahkan field baru ke payload jika ada di request
    if (content !== undefined) payload.content = content;
    if (config !== undefined) payload.config = config;
    
    if (Object.keys(payload).length === 0) {
      throw new Error("Tidak ada data yang diubah.");
    }

    const updatedContent = await UpdateData(id, payload, trx);
    await trx.commit();

    successResponse(res, 200, "success", "Konten berhasil diperbarui", false, null, systemContentResponse(updatedContent));
  } catch (error) {
    await trx.rollback();

    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "Error", "Key sudah ada, harus unik.");
    }
    errorResponse(res, 400, "Error", "Bad Request: ", error.message);
  }
};

// DELETE /system-contents/:id -> Menghapus konten
export const deleteSystemContent = async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction();

  try {
    const content = await SystemContent.findOne({
      where: { id },
      transaction: trx,
      lock: true,
    });

    if (!content) {
      throw new Error("Content not found");
    }

    await content.destroy({ transaction: trx, force: true });
    await trx.commit();

  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message);
  }

  // Kirim respons sukses di luar blok try...catch
  return successResponse(
    res,
    200,                          // -> meta.code
    "success",                    // -> meta.status
    "Content berhasil dihapus",      // -> meta.message (bisa diganti "")
    false,                         // -> meta.isPaginated
    null,                         // -> pagination
    null                          // -> data
  );
};
