import db from "../../config/database.js";
import {
  discountResponse,
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
} from "../../models/discount.js";
import Discount from "../../models/discount.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { Sequelize } from "sequelize";

// GET /discounts -> Mengambil semua diskon dengan paginasi
export const getAllDiscounts = async (req, res) => {
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

    const withUrls = result.discountList.map((u) => {
      const plainDiscount = u.get({ plain: true });


      return {
        ...plainDiscount,
        // img_icon: u.img_icon ? buildPublicUrl(u.img_icon) : null,
      };
    });

    successResponse(
      res,
      200,
      "success",
      "Discounts retrieved successfully",
      true,
      paginationData,
      withUrls
    );
  } catch (error) {
    errorResponse(
      res,
      400,
      "error",
      error.message || "Failed to retrieve discounts",
      false,
      null,
      null
    );
  }
};

// GET /discounts/:id -> Mengambil satu diskon berdasarkan ID
export const getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await GetDataById(id);

    if (!discount) {
      return errorResponse(
        res,
        404,
        "error",
        "Discount not found",
        false,
        null,
        null
      );
    }

    const payload = {
      ...discount.get({ plain: true }),
      // img_icon: discount.img_icon ? buildPublicUrl(discount.img_icon) : null,
    };
    delete payload.password;
    successResponse(
      res,
      200,
      "success",
      "Discount retrieved successfully",
      false,
      null,
      payload
    );
  } catch (error) {
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

// POST /discounts -> Membuat diskon baru
export const createDiscount = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { name, promo, voucher } = req.body;
    if (!name || !promo || !voucher) {
      throw new Error("Semua field wajib diisi.");
    }

    const payload = { name, promo, voucher };
    const created = await CreateData(trx, payload);

    const responsePayload = {
      id: created.id,
      name: created.name,
      promo: created.promo,
      voucher: created.voucher,
    };

    await trx.commit();
    return successResponse(res, 201, "success", "Diskon berhasil dibuat", false, null, responsePayload);

  } catch (error) {
    await trx.rollback();
    
    if (error instanceof Sequelize.UniqueConstraintError) {
      const field = error.errors[0]?.path;
      let message = "Data sudah terdaftar.";
      if (field === "name") message = "Nama promo sudah terdaftar.";
      if (field === "voucher") message = "Nama voucher sudah terdaftar.";
      return errorResponse(res, 409, "error", message);
    }
    
    return errorResponse(res, 400, "error", error.message || "Gagal membuat diskon.");
  }
};

// PUT /discounts/:id -> Memperbarui diskon
export const updateDiscount = async (req, res) => {
  const { id } = req.params;
  const { name, promo, voucher } = req.body;
  const trx = await db.transaction();

  try {
    const discount = await Discount.findOne({
      where: { id },
      transaction: trx,
      lock: true,
    });

    if (!discount) {
      throw new Error("Discount not found");
    }

    const payload = {
      name: name ?? discount.name,
      promo: promo ?? discount.promo,
      voucher: voucher ?? discount.voucher,
    };

    await discount.update(payload, { transaction: trx });
    await trx.commit();

  } catch (error) {
    await trx.rollback();
    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(res, 409, "error", "Nama promo atau voucher sudah terdaftar.");
    }
    return errorResponse(res, 400, "error", error.message);
  }

  // Kirim respons sukses di luar blok try...catch
  const updatedDiscount = await GetDataById(id);
  return successResponse(res, 200, "success", "Discount updated successfully", false, null, updatedDiscount);
};

// DELETE /discounts/:id -> Menghapus diskon
export const deleteDiscount = async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction();

  try {
    const discount = await Discount.findOne({
      where: { id },
      transaction: trx,
      lock: true,
    });

    if (!discount) {
      throw new Error("Discount not found");
    }

    await discount.destroy({ transaction: trx, force: true });
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
    "Diskon berhasil dihapus",      // -> meta.message (bisa diganti "")
    false,                        // -> meta.isPaginated
    null,                         // -> pagination
    null                          // -> data
  );
};