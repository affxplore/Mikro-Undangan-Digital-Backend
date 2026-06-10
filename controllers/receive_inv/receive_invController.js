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
// Tidak perlu import Invitation dan ReceiveInv lagi karena sudah dihandle di model
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";


export const getGuestByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const guest = await ReceiveInv.findOne({
      where: { code: code },
      attributes: ['recipient'] // Hanya ambil nama
    });

    if (!guest) {
      throw new Error("Tamu dengan kode ini tidak ditemukan.");
    }
    successResponse(res, 200, "success", "Data tamu ditemukan", false, null, guest);
  } catch (error) {
    errorResponse(res, 404, "error", error.message);
  }
};

// FUNGSI BARU (PUBLIK)
export const acceptInvitation = async (req, res) => {
  const { code } = req.params;
  try {
    const guest = await ReceiveInv.findOne({ where: { code } });
    // Kita hanya update jika status sebelumnya 'delivered' atau 'pending'
    if (guest && (guest.status === 'pending' || guest.status === 'delivered')) {
      await guest.update({ status: 'accepted' });
    }
    // Selalu kirim respons sukses agar tidak menghalangi user
    successResponse(res, 200, "success", "Status diterima.");
  } catch (error) {
    // Jika error, jangan blokir user, cukup log di server
    console.error("Gagal update status 'accepted':", error.message);
    successResponse(res, 200, "success", "OK");
  }
};


export const importGuests = async (req, res) => {
  const { invitationId } = req.params;
  const trx = await db.transaction();

  try {
    if (!req.file) {
      throw new Error("Tidak ada file yang diupload.");
    }

    // Baca file dari buffer memori
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Konversi sheet menjadi array of objects
    // Pastikan nama kolom di file Excel Anda adalah "Nama", "No WhatsApp", dan "Email"
    const guestsData = xlsx.utils.sheet_to_json(worksheet, {
      header: ["recipient", "phone_number", "email"] // <-- Sesuaikan dengan nama kolom di model Anda
    });

    // Hapus baris header jika ada
    if (guestsData[0]?.recipient?.toLowerCase() === 'nama') {
      guestsData.shift();
    }

    if (guestsData.length === 0) {
      throw new Error("File Excel kosong atau format kolom tidak sesuai (Harus: Nama, No WhatsApp, Email).");
    }

    // Siapkan data untuk dimasukkan ke database
    const payloads = guestsData.map(guest => ({
      invitation_id: invitationId,
      recipient: guest.recipient,
      phone_number: String(guest.phone_number), // Pastikan nomor telepon adalah string
      email: guest.email,
      code: Math.floor(100000 + Math.random() * 900000).toString(),
    }));

    // Gunakan bulkCreate untuk efisiensi
    await ReceiveInv.bulkCreate(payloads, { transaction: trx });

    await trx.commit();

    successResponse(res, 200, "success", `Berhasil mengimpor ${payloads.length} tamu.`);

  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};
// --- AKHIR FUNGSI BARU ---

// GET /receive_invs -> Mengambil semua penerima undangan dengan pagination dan filter
export const getAllReceive_invs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, invitation_id } = req.query;

    // Controller hanya perlu meneruskan parameter ke model
    const result = await GetDataList(
      { page, limit },
      { search, invitation_id } // <-- Tambahkan filter invitation_id jika ada
    );
    
     console.log("DEBUG RESULT:", result);

    const pagination = calculatePagination({ page, limit }, result.totalRows || 0);
    // const data = result.data.map(receiveInvResponse);
    
    const rawData = result?.data || result?.receiveInvList || [];

    const data = rawData.map(receiveInvResponse);

    successResponse(res, 200, "success", "Data penerima undangan berhasil diambil", true, pagination, data);
  } catch (error) {
    console.error("Gagal mengambil data penerima undangan:", error.message);console.error("ERROR GET RECEIVE INVS:", error);
    errorResponse(res, 500, "Error", error.message);
  }
};

// GET /receive_invs/:id -> Mengambil satu penerima undangan berdasarkan ID
export const getReceive_invById = async (req, res) => {
  try {
    const receiveInv = await ReceiveInv.findByPk(req.params.id, {
        include: [
        {
          model: Invitation,
          as: 'invitation',
          attributes: ['id', 'name'] // <-- Ambil hanya id dan title dari Template
        }
    ]
    });
    if (!receiveInv) {
      return errorResponse(res, 404, "Error", "Penerima undangan tidak ditemukan.");
    }
    successResponse(res, 200,"success", "Penerima undangan berhasil ditemukan", false, null, receiveInvResponse(receiveInv));
  } catch (error) {
    errorResponse(res, 500, "Error", error.message, false, null, null);
  }
};

// POST /receive_invs -> Membuat penerima undangan baru
export const createReceive_inv = async (req, res) => {
  const trx = await db.transaction();
  try {
    let { recipient, phone_number, invitation_id, email } = req.body;

    // Validasi dasar
    if (!recipient || !phone_number || !invitation_id) {
        throw new Error("Field recipient, phone_number, dan invitation_id wajib diisi.");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const payload = {
      recipient,
      phone_number,
      invitation_id,
      email: email && email.trim() !== '' ? email.trim() : null, // ← convert string kosong ke null agar tidak gagal validasi isEmail
      code
    };
    const newReceiveInv = await CreateData(payload, trx);
    await trx.commit();

    successResponse(res, 201, "success", "Penerima undangan berhasil dibuat", false, null, receiveInvResponse(newReceiveInv));
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};


// PUT /receive_invs/:id -> Memperbarui penerima undangan
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

    if (Object.keys(payload).length === 0) {
      throw new Error("Tidak ada data yang diubah.");
    }

    const updatedReceiveInv = await UpdateData(id, payload, trx);
    await trx.commit();

    successResponse(res, 200, true, "Penerima undangan berhasil diperbarui", false, null, receiveInvResponse(updatedReceiveInv));
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "Error", error.message, false, null, null);
  }
};

// DELETE /receive_invs/:id -> Menghapus penerima undangan
export const deleteReceive_inv = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    await DeleteData(id, trx);
    await trx.commit();

    successResponse(res, 200, "success", "Penerima undangan berhasil dihapus", false, null, null);
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};
