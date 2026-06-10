import db from "../../config/database.js";
import {
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
  priceResponse,
} from "../../models/price.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { Sequelize } from "sequelize";

// GET /prices -> Mengambil daftar harga
export const getAllPrices = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, filter } = req.query;

    let parsedFilter = {};
    if (filter) {
      try {
        parsedFilter = JSON.parse(filter);
      } catch {
        parsedFilter = {};
      }
    }

    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sort,
    };

    const result = await GetDataList(pagination, parsedFilter);
    const paginationData = calculatePagination(pagination, result.totalRows);

    const formattedData = result.priceList.map(priceResponse);

    successResponse(res, 200, "success", "Prices retrieved successfully", true, paginationData, formattedData);
  } catch (error) {
    errorResponse(res, 500, "error", error.message || "Failed to retrieve prices");
  }
};

// GET /prices/:id -> Mengambil satu harga
export const getPriceById = async (req, res) => {
  try {
    const { id } = req.params;
    const price = await GetDataById(id);

    if (!price) {
      return errorResponse(res, 404, "error", "Price not found");
    }

    const payload = priceResponse(price);
    successResponse(res, 200, "success", "Price retrieved successfully", false, null, payload);
  } catch (error) {
    errorResponse(res, 500, "error", error.message);
  }
};

// POST /prices -> Membuat harga baru
export const createPrice = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { subscription_id, amount, interval } = req.body;
    if (!subscription_id || !amount || !interval) {
      throw new Error("subscription_id, amount, dan interval wajib diisi.");
    }

    const payload = { subscription_id, amount, interval };
    const created = await CreateData(trx, payload);
    await trx.commit();

    const newPrice = await GetDataById(created.id);
    const responsePayload = priceResponse(newPrice);

    return successResponse(res, 201, "success", "Harga berhasil dibuat", false, null, responsePayload);
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message || "Gagal membuat harga.");
  }
};

// PUT /prices/:id -> Memperbarui harga
export const updatePrice = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { amount, interval } = req.body;

    const price = await GetDataById(id, { transaction: trx, lock: true });
    if (!price) throw new Error("Price not found");

    const payload = {
      amount: amount ?? price.amount,
      interval: interval ?? price.interval,
    };

    await UpdateData(trx, id, payload);
    await trx.commit();

    const updatedPrice = await GetDataById(id);
    const responsePayload = priceResponse(updatedPrice);

    return successResponse(res, 200, "success", "Price updated successfully", false, null, responsePayload);
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message);
  }
};

// DELETE /prices/:id -> Menghapus harga
export const deletePrice = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const price = await GetDataById(id, { transaction: trx, lock: true });
    if (!price) throw new Error("Price not found");

    await DeleteData(trx, id);
    await trx.commit();

    return successResponse(res, 200, "success", "Price deleted successfully");
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message);
  }
};