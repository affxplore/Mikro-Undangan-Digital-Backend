import db from "../../config/database.js";
import {
  kataUcapanResponse,
  CreateData,
  DeleteData,
  GetDataList,
  UpdateData,
} from "../../models/kata_ucapan.js";
import KataUcapan from "../../models/kata_ucapan.js";
import Sebar from "../../models/sebar.js"; // Impor model Sebar
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";

// GET /kata_ucapans -> Mengambil semua data dengan paginasi
export const getAllKataUcapans = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query; // Definisikan opsi untuk query, termasuk join ke tabel Sebar

    const options = {
      search: search,
      include: [
        {
          model: Sebar,
          attributes: ["id", "jenis_kalimat"], // Ambil id dan jenis_kalimat dari Sebar
        },
      ],
    };
    const result = await GetDataList({ page, limit }, { search });
    const pagination = calculatePagination({ page, limit }, result.totalRows);
    const data = result.data.map(kataUcapanResponse); // Format setiap item

    successResponse(
      res,
      200,
      "success",
      "Data kata ucapan berhasil diambil",
      true,
      pagination,
      data
    );
  } catch (error) {
    errorResponse(res, 500, "Error", error.message, false, null, null);
  }
};

// GET /kata_ucapans/:id -> Mengambil satu data berdasarkan ID
export const getKataUcapanById = async (req, res) => {
  try {
    // Tambahkan 'include' di sini agar konsisten
    const kataUcapan = await KataUcapan.findByPk(req.params.id, {
      include: [
        {
          model: Sebar,
          attributes: ["id", "jenis_kalimat"],
        },
      ],
    });
    if (!kataUcapan) {
      return errorResponse(res, 404, "Error", "Kata ucapan tidak ditemukan.");
    }
    successResponse(
      res,
      200,
      "success",
      "Kata ucapan berhasil ditemukan",
      false,
      null,
      kataUcapanResponse(kataUcapan)
    );
  } catch (error) {
    errorResponse(res, 500, "Error", error.message, false, null, null);
  }
};

// POST /kata_ucapans -> Membuat data baru
export const createKataUcapan = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { kalimat_ucapan, sambutan_awal, sebar_id } = req.body;
    if (!kalimat_ucapan || !sambutan_awal || !sebar_id) {
      throw new Error(
        "Semua field (kalimat_ucapan, sambutan_awal, sebar_id) wajib diisi."
      );
    }

    const payload = { kalimat_ucapan, sambutan_awal, sebar_id };
    const newData = await CreateData(payload, trx);
    await trx.commit();

    successResponse(
      res,
      201,
      "success",
      "Kata ucapan berhasil dibuat",
      false,
      null,
      kataUcapanResponse(newData)
    );
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "Error", error.message, false, null, null);
  }
};

// PUT /kata_ucapans/:id -> Memperbarui data
export const updateKataUcapan = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { kalimat_ucapan, sambutan_awal, sebar_id } = req.body;

    const payload = {};
    if (kalimat_ucapan) payload.kalimat_ucapan = kalimat_ucapan;
    if (sambutan_awal) payload.sambutan_awal = sambutan_awal;
    if (sebar_id) payload.sebar_id = sebar_id;

    if (Object.keys(payload).length === 0) {
      throw new Error("Tidak ada data yang diubah.");
    }

    const updatedData = await UpdateData(id, payload, trx);
    await trx.commit();

    successResponse(
      res,
      200,
      "success",
      "Kata ucapan berhasil diperbarui",
      false,
      null,
      kataUcapanResponse(updatedData)
    );
  } catch (error) {
    await trx.rollback();
    // Cek error spesifik dari model (cth: tidak ditemukan)
    if (error.message.includes("tidak ditemukan")) {
      return errorResponse(res, 404, "Error", error.message, false, null, null);
    }
    errorResponse(res, 400, "Error", error.message, false, null, null);
  }
};

// DELETE /kata_ucapans/:id -> Menghapus data
export const deleteKataUcapan = async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction();

  try {
    const kataUcapan = await KataUcapan.findOne({
      where: { id },
      transaction: trx,
      lock: true,
    });

    if (!kataUcapan) {
      throw new Error("Kata ucapan not found");
    }

    await kataUcapan.destroy({ transaction: trx, force: true });
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message, false, null, null);
  }

  // Kirim respons sukses di luar blok try...catch
  return successResponse(
    res,
    200, // -> meta.code
    "success", // -> meta.status
    "Kata ucapan berhasil dihapus", // -> meta.message (bisa diganti "")
    false, // -> meta.isPaginated
    null, // -> pagination
    null // -> data
  );
};
