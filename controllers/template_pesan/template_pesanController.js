import db from "../../config/database.js";
import TemplatePesan, {
  templatePesanResponse,
  CreateData,
  DeleteData,
  GetDataById,
  GetDataList,
  UpdateData,
} from "../../models/template_pesan.js";
import KategoriPesan from "../../models/kategori_pesan.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";

export const getAllTemplatePesan = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, kategori_pesan_id } = req.query;

    const pagination = { page, limit };
    const filter = { search, kategori_pesan_id };

    const result = await GetDataList(pagination, filter);
    const paginationData = calculatePagination(pagination, result.totalRows);
    const payload = result.data.map(templatePesanResponse);

    successResponse(
      res,
      200,
      "success",
      "Template pesan berhasil diambil",
      true,
      paginationData,
      payload
    );
  } catch (error) {
    errorResponse(res, 500, "error", error.message, false, null, null);
  }
};

export const getTemplatePesanById = async (req, res) => {
  try {
    const templatePesan = await TemplatePesan.findByPk(req.params.id, {
      include: [
        {
          model: KategoriPesan,
          as: "kategori_pesan",
          attributes: ["id", "nama_kategori"],
        },
      ],
    });

    if (!templatePesan) {
      return errorResponse(res, 404, "error", "Template pesan tidak ditemukan.", false, null, null);
    }

    successResponse(
      res,
      200,
      "success",
      "Template pesan berhasil ditemukan",
      false,
      null,
      templatePesanResponse(templatePesan)
    );
  } catch (error) {
    errorResponse(res, 500, "error", error.message, false, null, null);
  }
};

export const createTemplatePesan = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { kategori_pesan_id, nama_template, isi_pesan } = req.body;

    if (!kategori_pesan_id || !nama_template || !isi_pesan) {
      throw new Error("kategori_pesan_id, nama_template, dan isi_pesan wajib diisi.");
    }

    const kategori = await KategoriPesan.findByPk(kategori_pesan_id);
    if (!kategori) {
      throw new Error(`Kategori pesan dengan ID ${kategori_pesan_id} tidak ditemukan.`);
    }

    const created = await CreateData({ kategori_pesan_id, nama_template, isi_pesan }, trx);
    await trx.commit();

    await created.reload({
      include: [
        {
          model: KategoriPesan,
          as: "kategori_pesan",
          attributes: ["id", "nama_kategori"],
        },
      ],
    });

    successResponse(
      res,
      201,
      "success",
      "Template pesan berhasil dibuat",
      false,
      null,
      templatePesanResponse(created)
    );
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

export const updateTemplatePesan = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { kategori_pesan_id, nama_template, isi_pesan } = req.body;

    const payload = {};
    if (kategori_pesan_id) payload.kategori_pesan_id = kategori_pesan_id;
    if (nama_template) payload.nama_template = nama_template;
    if (isi_pesan) payload.isi_pesan = isi_pesan;

    if (Object.keys(payload).length === 0) {
      throw new Error("Tidak ada data yang diubah.");
    }

    if (payload.kategori_pesan_id) {
      const kategori = await KategoriPesan.findByPk(payload.kategori_pesan_id);
      if (!kategori) {
        throw new Error(`Kategori pesan dengan ID ${payload.kategori_pesan_id} tidak ditemukan.`);
      }
    }

    const updated = await UpdateData(id, payload, trx);
    await trx.commit();

    await updated.reload({
      include: [
        {
          model: KategoriPesan,
          as: "kategori_pesan",
          attributes: ["id", "nama_kategori"],
        },
      ],
    });

    successResponse(
      res,
      200,
      "success",
      "Template pesan berhasil diperbarui",
      false,
      null,
      templatePesanResponse(updated)
    );
  } catch (error) {
    await trx.rollback();

    if (error.message.includes("tidak ditemukan")) {
      return errorResponse(res, 404, "error", error.message, false, null, null);
    }

    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

export const deleteTemplatePesan = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    await DeleteData(id, trx);
    await trx.commit();
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message, false, null, null);
  }

  successResponse(
    res,
    200,
    "success",
    "Template pesan berhasil dihapus",
    false,
    null,
    null
  );
};
