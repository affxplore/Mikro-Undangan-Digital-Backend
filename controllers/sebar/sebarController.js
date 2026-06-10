import db from "../../config/database.js";
import {
  sebarResponse,
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
} from "../../models/sebar.js";
import Sebar from "../../models/sebar.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { Sequelize } from "sequelize";

// GET /sebars -> Mengambil semua data sebar dengan paginasi
export const getAllSebars = async (req, res) => {
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

    const withUrls = result.sebarList.map((u) => {
      const plainSebar = u.get({ plain: true });


      return {
        ...plainSebar,
        // img_icon: u.img_icon ? buildPublicUrl(u.img_icon) : null,
      };
    });

    successResponse(
      res,
      200,
      "success",
      "Sebars retrieved successfully",
      true,
      paginationData,
      withUrls
    );
  } catch (error) {
    errorResponse(
      res,
      400,
      "error",
      error.message || "Failed to retrieve sebars",
      false,
      null,
      null
    );
  }
};

// GET /sebars/:id -> Mengambil satu sebar berdasarkan ID
export const getSebarById = async (req, res) => {
  try {
    const { id } = req.params;
    const sebar = await GetDataById(id);

    if (!sebar) {
      return errorResponse(
        res,
        404,
        "error",
        "Sebar not found",
        false,
        null,
        null
      );
    }

    const payload = {
      ...sebar.get({ plain: true }),
      // img_icon: sebar.img_icon ? buildPublicUrl(sebar.img_icon) : null,
    };
    delete payload.password;
    successResponse(
      res,
      200,
      "success",
      "Sebar retrieved successfully",
      false,
      null,
      payload
    );
  } catch (error) {
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

// POST /sebars -> Membuat sebar baru
export const createSebar = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { jenis_kalimat } = req.body;
    if (!jenis_kalimat) {
      throw new Error("Semua field wajib diisi.");
    }

    const payload = { jenis_kalimat };
    const created = await CreateData(trx, payload);

    const responsePayload = {
      id: created.id,
      jenis_kalimat: created.jenis_kalimat,
    };

    await trx.commit();
    return successResponse(res, 201, "success", "Sebar berhasil dibuat", false, null, responsePayload);

  } catch (error) {
    await trx.rollback();
    
    if (error instanceof Sequelize.UniqueConstraintError) {
      const field = error.errors[0]?.path;
      let message = "Data sudah terdaftar.";
      if (field === "jenis_kalimat") message = "Jenis kalimat sudah terdaftar.";
      return errorResponse(res, 409, "error", message);
    }

    return errorResponse(res, 400, "error", error.message || "Gagal membuat sebar.");
  }
};

// PUT /sebars/:id -> Memperbarui sebar
export const updateSebar = async (req, res) => {
  const { id } = req.params;
  const { jenis_kalimat } = req.body;
  const trx = await db.transaction();

  try {
    const sebar = await Sebar.findOne({
      where: { id },
      transaction: trx,
      lock: true,
    });

    if (!sebar) {
      throw new Error("Sebar not found");
    }

    const payload = {
      jenis_kalimat: jenis_kalimat ?? sebar.jenis_kalimat,
      // voucher: voucher ?? discount.voucher,
    };

    await sebar.update(payload, { transaction: trx });
    await trx.commit();

  } catch (error) {
    await trx.rollback();
    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "error", "Jenis kalimat sudah terdaftar.");
    }
    return errorResponse(res, 400, "error", error.message);
  }

  // Kirim respons sukses di luar blok try...catch
  const updatedSebar = await GetDataById(id);
  return successResponse(res, 200, "success", "Sebar updated successfully", false, null, updatedSebar);
};

// DELETE /sebars/:id -> Menghapus sebar
export const deleteSebar = async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction();

  try {
    const sebar = await Sebar.findOne({
      where: { id },
      transaction: trx,
      lock: true,
    });

    if (!sebar) {
      throw new Error("Sebar not found");
    }

    await sebar.destroy({ transaction: trx, force: true });
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
    "Sebar berhasil dihapus",      // -> meta.message (bisa diganti "")
    false,                         // -> meta.isPaginated
    null,                         // -> pagination
    null                          // -> data
  );
};