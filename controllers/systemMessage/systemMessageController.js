import db from "../../config/database.js";
import {
  GetSystemMessageList,
  GetSystemMessageById,
  CreateSystemMessage,
  UpdateSystemMessage,
  DeleteSystemMessage,
  systemMessageResponse
} from "../../models/systemMessage.js";
import UserNotification from "../../models/userNotification.js";
import User from "../../models/user.js"; // pastikan model User ada
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";

// GET /system-messages
export const listSystemMessages = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await GetSystemMessageList({ page, limit });
    const paginationData = calculatePagination({ page, limit }, result.totalRows);

    successResponse(res, 200, "success", "System messages retrieved", true, paginationData,
      result.list.map(systemMessageResponse));
  } catch (err) {
    errorResponse(res, 500, "error", err.message);
  }
};

// POST /system-messages
export const createSystemMessage = async (req, res) => {
  const trx = await db.transaction();
  try {
    const newMsg = await CreateSystemMessage(trx, req.body);

    // Generate notif ke semua user
    const users = await User.findAll({ attributes: ["id"], transaction: trx });
    const notifications = users.map(u => ({
      user_id: u.id,
      system_message_id: newMsg.id,
      is_read: false,
    }));
    await UserNotification.bulkCreate(notifications, { transaction: trx });

    await trx.commit();
    successResponse(res, 201, "success", "System message created", false, null, systemMessageResponse(newMsg));
  } catch (err) {
    await trx.rollback();
    errorResponse(res, 500, "error", err.message);
  }
};

// GET /system-messages/:id
export const getSystemMessage = async (req, res) => {
  try {
    const msg = await GetSystemMessageById(req.params.id);
    if (!msg) return errorResponse(res, 404, "error", "System message not found");
    successResponse(res, 200, "success", "System message retrieved", false, null, systemMessageResponse(msg));
  } catch (err) {
    errorResponse(res, 500, "error", err.message);
  }
};

// PUT /system-messages/:id
export const updateSystemMessage = async (req, res) => {
  const trx = await db.transaction();
  try {
    const updatedMsg = await UpdateSystemMessage(trx, req.params.id, req.body);
    await trx.commit();
    successResponse(res, 200, "success", "System message updated", false, null, systemMessageResponse(updatedMsg));
  } catch (err) {
    await trx.rollback();
    errorResponse(res, 500, "error", err.message);
  }
};

// DELETE /system-messages/:id
export const deleteSystemMessage = async (req, res) => {
  const trx = await db.transaction();
  try {
    const result = await DeleteSystemMessage(trx, req.params.id);
    await trx.commit();
    successResponse(res, 200, "success", result.message);
  } catch (err) {
    await trx.rollback();
    errorResponse(res, 500, "error", err.message);
  }
};
