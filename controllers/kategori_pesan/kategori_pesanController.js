import db from "../../config/database.js";
import KategoriPesan, {
  kategoriPesanResponse,
  CreateData,
  DeleteData,
  GetDataById,
  GetDataList,
  UpdateData,
} from "../../models/kategori_pesan.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { Sequelize } from "sequelize";

export const getAllKategoriPesan = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, filter } = req.query;

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
      page: Number.parseInt(page, 10),
      limit: Number.parseInt(limit, 10),
      sort: typeof sort === "string" ? sort : undefined,
    };

    const result = await GetDataList(pagination, parsedFilter);
    const paginationData = calculatePagination(pagination, result.totalRows);

    const payload = result.kategoriList.map((item) =>
      kategoriPesanResponse(item)
    );

    successResponse(
      res,
      200,
      "success",
      "Kategori pesan retrieved successfully",
      true,
      paginationData,
      payload
    );
  } catch (error) {
    errorResponse(
      res,
      400,
      "error",
      error.message || "Failed to retrieve kategori pesan",
      false,
      null,
      null
    );
  }
};

export const getKategoriPesanById = async (req, res) => {
  try {
    const { id } = req.params;
    const kategoriPesan = await GetDataById(id);

    if (!kategoriPesan) {
      return errorResponse(
        res,
        404,
        "error",
        "Kategori pesan not found",
        false,
        null,
        null
      );
    }

    successResponse(
      res,
      200,
      "success",
      "Kategori pesan retrieved successfully",
      false,
      null,
      kategoriPesanResponse(kategoriPesan)
    );
  } catch (error) {
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

export const createKategoriPesan = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { nama_kategori } = req.body;
    if (!nama_kategori) {
      throw new Error("Field nama_kategori wajib diisi.");
    }

    const created = await CreateData({ nama_kategori }, trx);
    await trx.commit();

    successResponse(
      res,
      201,
      "success",
      "Kategori pesan berhasil dibuat",
      false,
      null,
      kategoriPesanResponse(created)
    );
  } catch (error) {
    await trx.rollback();

    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "error", "Nama kategori sudah terdaftar.");
    }

    errorResponse(res, 400, "error", error.message || "Gagal membuat kategori pesan.");
  }
};

export const updateKategoriPesan = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { nama_kategori } = req.body;

    if (!nama_kategori) {
      throw new Error("Field nama_kategori wajib diisi.");
    }

    const updated = await UpdateData(id, { nama_kategori }, trx);
    await trx.commit();

    successResponse(
      res,
      200,
      "success",
      "Kategori pesan berhasil diperbarui",
      false,
      null,
      kategoriPesanResponse(updated)
    );
  } catch (error) {
    await trx.rollback();

    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "error", "Nama kategori sudah terdaftar.");
    }

    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

export const deleteKategoriPesan = async (req, res) => {
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
    "Kategori pesan berhasil dihapus",
    false,
    null,
    null
  );
};
