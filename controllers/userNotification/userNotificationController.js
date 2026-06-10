import db from "../../config/database.js";
import {
  GetDataList,
  GetDataById,
  CreateData,
  UpdateData,
  DeleteData,
} from "../../models/userNotification.js";
import UserNotification from "../../models/userNotification.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";

// GET /user-notifications
export const getAllUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, filter } = req.query;

    let parsedFilter = {};
    if (typeof filter === "string") {
      try {
        parsedFilter = JSON.parse(filter);
      } catch {
        parsedFilter = {};
      }
    }

    // otomatis filter ke user login (biar user cuma liat notif dirinya)
    const userId = req.user?.id;
    if (userId) parsedFilter.user_id = userId;

    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: typeof sort === "string" ? sort : "createdAt DESC",
    };

    const result = await GetDataList(pagination, parsedFilter);
    const paginationData = calculatePagination(pagination, result.totalRows);

    const plainData = result.userNotificationList.map((u) => u.get({ plain: true }));

    successResponse(
      res,
      200,
      "success",
      "User notifications retrieved successfully",
      true,
      paginationData,
      plainData
    );
  } catch (error) {
    errorResponse(res, 400, "error", error.message);
  }
};

// GET /user-notifications/:id
export const getUserNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await GetDataById(id);

    if (!notif || notif.user_id !== req.user?.id) {
      return errorResponse(res, 404, "error", "UserNotification not found");
    }

    successResponse(res, 200, "success", "UserNotification retrieved", false, null, notif);
  } catch (error) {
    errorResponse(res, 400, "error", error.message);
  }
};

// PUT /user-notifications/:id  (mark as read / update message)
export const updateUserNotification = async (req, res) => {
  const { id } = req.params;
  const { message, is_read } = req.body;
  const trx = await db.transaction();

  try {
    const notif = await UserNotification.findOne({
      where: { id, user_id: req.user?.id },
      transaction: trx,
      lock: true,
    });
    if (!notif) throw new Error("UserNotification not found");

    await notif.update(
      { 
        message: message ?? notif.message,
        is_read: is_read ?? notif.is_read 
      },
      { transaction: trx }
    );

    await trx.commit();

    const updated = await GetDataById(id);
    return successResponse(res, 200, "success", "UserNotification updated", false, null, updated);
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message);
  }
};

// DELETE /user-notifications/:id
export const deleteUserNotification = async (req, res) => {
  const { id } = req.params;
  const trx = await db.transaction();

  try {
    const notif = await UserNotification.findOne({
      where: { id, user_id: req.user?.id },
      transaction: trx,
      lock: true,
    });
    if (!notif) throw new Error("UserNotification not found");

    await notif.destroy({ transaction: trx, force: true });
    await trx.commit();

    return successResponse(res, 200, "success", "UserNotification deleted");
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message);
  }
};
