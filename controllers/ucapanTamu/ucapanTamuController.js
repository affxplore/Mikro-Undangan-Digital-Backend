import db from "../../config/database.js";
import {
  ucapanTamuResponse,
  CreateData,
  DeleteData,
  UpdateData,
  GetDataById,
  GetDataList,
} from "../../models/ucapanTamu.js";
import ReceiveInv from '../../models/receive_inv.js'; // Impor modelnya
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import Invitation from "../../models/invitation.js";

const validStatus = ["tidak hadir", "hadir", "kapan kapan"];

const validateAttendanceStatus = (status) => {
  if (status && !validStatus.includes(status)) {
    throw new Error(
      `Status kehadiran tidak valid. Gunakan salah satu dari: ${validStatus.join(", ")}.`
    );
  }
};

// GET /ucapan-tamu
export const getAllUcapanTamus = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter } = req.query;

    const includeOptions = [
      {
        model: Invitation,
        as: "invitation",
        attributes: ["id", "name"], 
      },
    ];

    let parsedFilter = {};
    if (filter && typeof filter === "string") {
      try {
        parsedFilter = JSON.parse(filter);
      } catch (e) {
        /* abaikan filter tidak valid */
      }
    }

    if (!parsedFilter.invitation_id) {
      return errorResponse(
        res,
        400,
        "error",
        "Filter 'invitation_id' wajib diisi."
      );
    }

    // Ambil hasil dari model
    const result = await GetDataList({ page, limit }, parsedFilter, includeOptions);
    
    // Hitung pagination menggunakan totalRows dari model
    const pagination = calculatePagination({ page, limit }, result.totalRows);
    
    // Mapping data menggunakan ucapanList (sesuai return di model)
    const data = result.ucapanList.map(ucapanTamuResponse);

    successResponse(
      res,
      200,
      "success",
      "Data ucapan berhasil diambil",
      true,
      pagination,
      data
    );
  } catch (error) {
    // Log error agar kamu bisa lihat di terminal backend jika ada masalah lain
    console.error("Error in getAllUcapanTamus:", error); 
    errorResponse(res, 500, "error", error.message);
  }
};

export const getUcapanTamuById = async (req, res) => {
  try {
    const { id } = req.params;
    const ucapan = await GetDataById(id);

    if (!ucapan) {
      return errorResponse(res, 404, "error", "Data ucapan tidak ditemukan.");
    }

    successResponse(
      res,
      200,
      "success",
      "Data ucapan berhasil ditemukan",
      false,
      null,
      ucapanTamuResponse(ucapan)
    );
  } catch (error) {
    errorResponse(res, 500, "error", error.message);
  }
};

// POST /ucapan-tamu
export const createUcapanTamu = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { invitation_id, notes, attendance_status, guest_name, guest_code } = req.body;
    
    if (!invitation_id || !attendance_status || !guest_name) {
      throw new Error(
        "Invitation ID, Nama Tamu, dan Status Kehadiran wajib diisi."
      );
    }

    validateAttendanceStatus(attendance_status);

    const payload = { invitation_id, notes, attendance_status, guest_name };

    // Jika ada guest_code, cari ID penerima undangan yang sesuai
    if (guest_code) {
      const invitedGuest = await ReceiveInv.findOne({
        where: { code: guest_code, invitation_id: invitation_id }
      });
      if (invitedGuest) {
        payload.receive_inv_id = invitedGuest.id; // <-- Hubungkan datanya!
      }
    }

    const newUcapan = await CreateData(trx, payload);
    await trx.commit();
    
    successResponse(res, 201, "success", "Ucapan berhasil dikirim", false, null, ucapanTamuResponse(newUcapan));
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

export const updateUcapanTamu = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { notes, attendance_status, guest_name } = req.body;

    validateAttendanceStatus(attendance_status);

    // Siapkan payload hanya dengan data yang dikirim
    const payload = {};
    if (notes !== undefined) payload.notes = notes;
    if (attendance_status !== undefined) payload.attendance_status = attendance_status;
    if (guest_name !== undefined) payload.guest_name = guest_name;

    if (Object.keys(payload).length === 0) {
      throw new Error("Tidak ada data yang diubah.");
    }

    const updatedUcapan = await UpdateData(trx, id, payload);
    await trx.commit();

    successResponse(
      res,
      200,
      "success",
      "Ucapan berhasil diperbarui",
      false,
      null,
      ucapanTamuResponse(updatedUcapan)
    );
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

// DELETE /ucapan-tamu/:id
export const deleteUcapanTamu = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const userRole = req.user?.role; // Ambil role dari token (via middleware verifyToken)

    // Otorisasi sederhana: Hanya Admin/Owner yang boleh menghapus
    if (!["Super Admin", "Owner", "Admin", "User"].includes(userRole)) {
      return errorResponse(
        res,
        403,
        "error",
        "Anda tidak memiliki izin untuk menghapus data ini."
      );
    }

    await DeleteData(trx, id);
    await trx.commit();

    successResponse(
      res,
      200,
      "success",
      "Ucapan berhasil dihapus",
      false,
      null,
      null
    );
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};