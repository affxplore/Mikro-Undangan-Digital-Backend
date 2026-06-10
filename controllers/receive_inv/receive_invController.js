import db from "../../config/database.js";
import {
  receiveInvResponse,
  CreateData,
  DeleteData,
  GetDataList,
  UpdateData,
} from "../../models/receive_inv.js";
import ReceiveInv from "../../models/receive_inv.js";
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import Invitation from "../../models/invitation.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";

export const getGuestByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const guest = await ReceiveInv.findOne({
      where: { code: code },
      attributes: ['recipient']
    });

    if (!guest) {
      throw new Error("Tamu dengan kode ini tidak ditemukan.");
    }
    successResponse(res, 200, "success", "Data tamu ditemukan", false, null, guest);
  } catch (error) {
    errorResponse(res, 404, "error", error.message);
  }
};

export const acceptInvitation = async (req, res) => {
  const { code } = req.params;
  try {
    const guest = await ReceiveInv.findOne({ where: { code } });
    if (guest && (guest.status === 'pending' || guest.status === 'delivered')) {
      await guest.update({ status: 'accepted' });
    }
    successResponse(res, 200, "success", "Status diterima.");
  } catch (error) {
    console.error("Gagal update status 'accepted':", error.message);
    successResponse(res, 200, "success", "OK");
  }
};

export const importGuests = async (req, res) => {
  const { invitationId } = req.params;
  const trx = await db.transaction();
  try {
    if (!req.file) throw new Error("Tidak ada file yang diupload.");

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const guestsData = xlsx.utils.sheet_to_json(worksheet, {
      header: ["recipient", "phone_number", "email"]
    });

    if (guestsData[0]?.recipient?.toLowerCase() === 'nama') {
      guestsData.shift();
    }

    if (guestsData.length === 0) {
      throw new Error("File Excel kosong atau format kolom tidak sesuai.");
    }

    const payloads = guestsData.map(guest => ({
      invitation_id: invitationId,
      recipient: guest.recipient,
      phone_number: String(guest.phone_number),
      email: guest.email,
      code: Math.floor(100000 + Math.random() * 900000).toString(),
    }));

    await ReceiveInv.bulkCreate(payloads, { transaction: trx });
    await trx.commit();
    successResponse(res, 200, "success", `Berhasil mengimpor ${payloads.length} tamu.`);
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

export const getAllReceive_invs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, invitation_id } = req.query;
    const result = await GetDataList(
      { page, limit },
      { search, invitation_id }
    );
    
    const pagination = calculatePagination({ page, limit }, result.totalRows);
    const data = result.receiveInvList.map(receiveInvResponse);

    successResponse(res, 200, "success", "Data penerima undangan berhasil diambil", true, pagination, data);
  } catch (error) {
    errorResponse(res, 500, "Error", error.message);
  }
};

export const getReceive_invById = async (req, res) => {
  try {
    const receiveInv = await ReceiveInv.findByPk(req.params.id, {
        include: [{
          model: Invitation,
          as: 'invitation',
          attributes: ['id', 'name']
        }]
    });
    if (!receiveInv) return errorResponse(res, 404, "Error", "Penerima undangan tidak ditemukan.");
    successResponse(res, 200,"success", "Penerima undangan berhasil ditemukan", false, null, receiveInvResponse(receiveInv));
  } catch (error) {
    errorResponse(res, 500, "Error", error.message);
  }
};

// ==========================================
// PERBAIKAN UTAMA DI SINI (POST /receive_invs)
// ==========================================
export const createReceive_inv = async (req, res) => {
  const trx = await db.transaction();
  try {
    let { recipient, nama, phone_number, invitation_id, email } = req.body;

    // Menangani jika frontend mengirim 'nama' tapi backend butuh 'recipient'
    const finalRecipient = recipient || nama;

    if (!finalRecipient || !phone_number || !invitation_id) {
        throw new Error("Nama (recipient), Nomor HP, dan ID Undangan wajib diisi.");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Pastikan payload menggunakan nama kolom sesuai model database
    const payload = { 
        recipient: finalRecipient, 
        phone_number, 
        invitation_id, 
        email, 
        code,
        status: 'pending' 
    };

    // PERBAIKAN URUTAN PARAMETER: (trx, payload)
    const newReceiveInv = await CreateData(trx, payload);
    
    await trx.commit();
    successResponse(res, 201, "success", "Penerima undangan berhasil dibuat", false, null, receiveInvResponse(newReceiveInv));
  } catch (error) {
    if (trx) await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

export const updateReceive_inv = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const { invitation_id, recipient, phone_number, email, code, status } = req.body;

    const payload = {};
    if (typeof invitation_id !== 'undefined') payload.invitation_id = invitation_id;
    if (typeof recipient !== 'undefined') payload.recipient = recipient;
    if (typeof phone_number !== 'undefined') payload.phone_number = phone_number;
    if (typeof email !== 'undefined') payload.email = email;
    if (typeof code !== 'undefined') payload.code = code;
    if (typeof status !== 'undefined') payload.status = status;

    // PERBAIKAN URUTAN PARAMETER: (trx, id, payload)
    const updatedReceiveInv = await UpdateData(trx, id, payload);
    await trx.commit();

    successResponse(res, 200, true, "Penerima undangan berhasil diperbarui", false, null, receiveInvResponse(updatedReceiveInv));
  } catch (error) {
    if (trx) await trx.rollback();
    errorResponse(res, 400, "Error", error.message);
  }
};

export const deleteReceive_inv = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    // PERBAIKAN URUTAN PARAMETER: (trx, id)
    await DeleteData(trx, id);
    await trx.commit();

    successResponse(res, 200, "success", "Penerima undangan berhasil dihapus", false, null, null);
  } catch (error) {
    if (trx) await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};