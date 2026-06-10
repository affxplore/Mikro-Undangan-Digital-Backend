import db from "../../config/database.js";
import TemplateSalam, {
  templateSalamResponse,
  CreateData,
  DeleteData,
  GetDataById,
  GetDataList,
  UpdateData,
} from "../../models/template_salam.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";

export const getAllTemplateSalam = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pagination = { page, limit };
    const filter = { search };

    const result = await GetDataList(pagination, filter);
    const paginationData = calculatePagination(pagination, result.totalRows);
    const payload = result.data.map(templateSalamResponse);

    successResponse(
      res,
      200,
      "success",
      "Template salam berhasil diambil",
      true,
      paginationData,
      payload
    );
  } catch (error) {
    errorResponse(res, 500, "error", error.message, false, null, null);
  }
};

export const getTemplateSalamById = async (req, res) => {
  try {
    const templateSalam = await GetDataById(req.params.id);
    if (!templateSalam) {
      return errorResponse(res, 404, "error", "Template salam tidak ditemukan.", false, null, null);
    }

    successResponse(
      res,
      200,
      "success",
      "Template salam berhasil ditemukan",
      false,
      null,
      templateSalamResponse(templateSalam)
    );
  } catch (error) {
    errorResponse(res, 500, "error", error.message, false, null, null);
  }
};

export const createTemplateSalam = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { kategori, teks } = req.body;
    if (!kategori || !teks) {
      throw new Error("kategori dan teks wajib diisi.");
    }

    const created = await CreateData({ kategori, teks }, trx);
    await trx.commit();

    successResponse(
      res,
      201,
      "success",
      "Template salam berhasil dibuat",
      false,
      null,
      templateSalamResponse(created)
    );
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

export const updateTemplateSalam = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { kategori, teks } = req.body;

    const payload = {};
    if (kategori) payload.kategori = kategori;
    if (teks) payload.teks = teks;

    if (Object.keys(payload).length === 0) {
      throw new Error("Tidak ada data yang diubah.");
    }

    const updated = await UpdateData(id, payload, trx);
    await trx.commit();

    successResponse(
      res,
      200,
      "success",
      "Template salam berhasil diperbarui",
      false,
      null,
      templateSalamResponse(updated)
    );
  } catch (error) {
    await trx.rollback();

    if (error.message.includes("not found")) {
      return errorResponse(res, 404, "error", error.message, false, null, null);
    }

    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

export const deleteTemplateSalam = async (req, res) => {
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
    "Template salam berhasil dihapus",
    false,
    null,
    null
  );
};
