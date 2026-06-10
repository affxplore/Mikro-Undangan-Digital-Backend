import db from "../../config/database.js";
import {
  paymentResponse,
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
} from "../../models/payment.js";
import Payment from "../../models/payment.js";
import midtransclient from 'midtrans-client';
import Transaksi from '../../models/transaksi.js';
import User from "../../models/user.js";
import Price from "../../models/price.js";
import Subscription from "../../models/subscription.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import {
  relFromPublic,
  safeUnlink,
  buildPublicUrl,
} from "../../helpers/files.js";
import path from "path";
import { Sequelize } from "sequelize";


const snap = new midtransclient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// export const createSubscriptionPayment = async (req, res) => {
//     const { price_id } = req.body;
//     const { id: user_id } = req.user;
//     const trx = await db.transaction();

//     try {
//         const user = await User.findByPk(user_id);
//         const price = await Price.findByPk(price_id, { include: 'subscription' });
//         if (!user || !price) throw new Error("User atau detail harga tidak ditemukan.");
        
//         const no_trx = `SUB-${Date.now()}-${user_id}`;
//         const amount = price.amount;
//         const intervalDays = price.interval === 'month' ? 30 : 365;
//         const expires_at = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

//         // Buat transaksi di database Anda dengan status 'pending'
//         await Transaksi.create({
//             no_trx,
//             user_id,
//             user_name: user.full_name,
//             subscription_id: price.subscription_id,
//             subscription_name: price.subscription.name,
//             price_id: price.id,
//             amount,
//             status: 'pending',
//             expires_at
//         }, { transaction: trx });
        
//         // Siapkan parameter untuk Midtrans
//         const parameter = {
//             transaction_details: { order_id: no_trx, gross_amount: amount },
//             customer_details: { first_name: user.full_name, email: user.email, phone: user.whatsapp_number }
//         };
        
//         // Minta token transaksi ke Midtrans
//         const token = await snap.createTransactionToken(parameter);

//         await trx.commit();
//         successResponse(res, 201, "success", "Token pembayaran berhasil dibuat", false, null, { token });

//     } catch (error) {
//         await trx.rollback();
//         errorResponse(res, 400, "error", error.message);
//     }
// };

// export const handleMidtransWebhook = async (req, res) => {
//   const trx = await db.transaction();
//   try {
//     // Inisialisasi Core API client dari Midtrans
//     const apiClient = new midtransclient.CoreApi({
//         isProduction: false,
//         serverKey: process.env.MIDTRANS_SERVER_KEY,
//         clientKey: process.env.MIDTRANS_CLIENT_KEY
//     });

//     const notificationJson = req.body;
    
//     // --- TAMBAHKAN LOG UNTUK MELIHAT NOTIFIKASI MENTAH ---
//     console.log("===== WEBHOOK DITERIMA =====");
//     console.log(JSON.stringify(notificationJson, null, 2));
//     console.log("============================");

//     // Verifikasi status transaksi di server Midtrans untuk keamanan
//     const statusResponse = await apiClient.transaction.status(notificationJson.order_id);
//     const orderId = statusResponse.order_id;
//     const transactionStatus = statusResponse.transaction_status;
//     const fraudStatus = statusResponse.fraud_status;

//     const localTransaction = await Transaksi.findOne({ where: { no_trx: orderId } });
//     if (!localTransaction) {
//       console.log(`Webhook: Transaksi dengan ID ${orderId} tidak ditemukan di database lokal.`);
//       // Kirim 200 OK agar Midtrans berhenti mengirim notifikasi
//       return res.status(200).send('Transaksi tidak ditemukan, notifikasi diabaikan.');
//     }

//     // Hanya proses jika status transaksi masih 'pending'
//     if (localTransaction.status === 'pending') {
//         if (transactionStatus == 'capture' || transactionStatus == 'settlement'){
//             if (fraudStatus == 'accept') {
//                 await localTransaction.update({ status: 'success' }, { transaction: trx });
                
//                 const user = await User.findByPk(localTransaction.user_id);
//                 if(user) {
//                   await user.update({
//                       subscription_id: localTransaction.subscription_id,
//                       subscription_expires_at: localTransaction.expires_at
//                   }, { transaction: trx });
//                 }
//             }
//         } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire'){
//             await localTransaction.update({ status: 'failed' }, { transaction: trx });
//         }
//     }
    
//     await trx.commit();
//     res.status(200).send('Webhook berhasil diproses.');

//   } catch (error) {
//     await trx.rollback();
//     console.error("Webhook Error:", error.message);
//     res.status(500).send({ error: error.message });
//   }
// };

// export const handleMidtransWebhook = async (req, res) => {
//   const trx = await db.transaction();
//   try {
//     // 1. Buat instance API Midtrans untuk verifikasi notifikasi
//     const apiClient = new midtransclient.CoreApi({
//         isProduction: false,
//         serverKey: process.env.MIDTRANS_SERVER_KEY,
//         clientKey: process.env.MIDTRANS_CLIENT_KEY
//     });
    
//     const notification = req.body;
//     const orderId = notification.order_id;
//     const transactionStatus = notification.transaction_status;

//     // 2. Verifikasi status transaksi di server Midtrans untuk keamanan
//     const statusResponse = await apiClient.transaction.status(orderId);
//     if (transactionStatus !== statusResponse.transaction_status) {
//         throw new Error("Status transaksi tidak cocok.");
//     }
    
//     // 3. Cari transaksi di database Anda
//     const localTransaction = await Transaksi.findOne({ where: { no_trx: orderId } });
//     if (!localTransaction) throw new Error("Transaksi tidak ditemukan.");

//     // 4. Update status dan upgrade user jika pembayaran berhasil
//     if (transactionStatus == 'capture' || transactionStatus == 'settlement'){
//         if (localTransaction.status === 'pending') {
//             await localTransaction.update({ status: 'success' }, { transaction: trx });
            
//             // Upgrade user
//             const user = await User.findByPk(localTransaction.user_id);
//             await user.update({
//                 subscription_id: localTransaction.subscription_id,
//                 subscription_expires_at: localTransaction.expires_at // Kolom ini perlu ditambahkan ke model User
//             }, { transaction: trx });
//         }
//     } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire'){
//         await localTransaction.update({ status: 'failed' }, { transaction: trx });
//     }
    
//     await trx.commit();
//     res.status(200).send('OK');

//   } catch (error) {
//     await trx.rollback();
//     res.status(500).send({ error: error.message });
//   }
// };

// GET /payments -> Mengambil semua metode pembayaran dengan paginasi
export const getAllPayments = async (req, res) => {
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

    const withUrls = result.paymentList.map((u) => {
      const plainPayment = u.get({ plain: true });

      return {
        ...plainPayment,
        qr_code: u.qr_code ? buildPublicUrl(u.qr_code) : null,
      };
    });

    successResponse(
      res,
      200,
      "success",
      "Payments retrieved successfully",
      true,
      paginationData,
      withUrls
    );
  } catch (error) {
    errorResponse(
      res,
      400,
      "error",
      error.message || "Failed to retrieve payments",
      false,
      null,
      null
    );
  }
};

// GET /payments/:id -> Mengambil satu metode pembayaran berdasarkan ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await GetDataById(id);

    if (!payment) {
      return errorResponse(
        res,
        404,
        "error",
        "Payment not found",
        false,
        null,
        null
      );
    }

    const payload = {
      ...payment.get({ plain: true }),
      qr_code: payment.qr_code ? buildPublicUrl(payment.qr_code) : null,
    };
    delete payload.password;
    successResponse(
      res,
      200,
      "success",
      "Payment retrieved successfully",
      false,
      null,
      payload
    );
  } catch (error) {
    errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

// POST /payments -> Membuat metode pembayaran baru
export const createPayment = async (req, res) => {
  // 1. Memulai transaksi database
  const trx = await db.transaction();
  let newFileAbsPath = null;

  try {
    // 2. Mengambil dan memvalidasi data dari request body
    let { name, bank_account, isActive } = req.body;

    if (!name || !bank_account) {
      throw new Error("Nama metode pembayaran dan nomor rekening wajib diisi.");
    }

    // 5. Menangani upload file gambar kategori
    let QrCodeRel = null;
    if (req.file) {
      newFileAbsPath = req.file.path;
      QrCodeRel = relFromPublic(req.file.path);

      // ================== TAMBAHKAN LOG DI SINI ==================
      console.log("--- DEBUG FILE UPLOAD ---");
      console.log("1. Objek req.file dari Multer:", req.file);
      console.log(
        "2. Path Absolut (Input untuk relFromPublic):",
        newFileAbsPath
      );

      QrCodeRel = relFromPublic(req.file.path);

      console.log("3. Path Relatif (Output dari relFromPublic):", QrCodeRel);
      console.log("--------------------------");
      // ==========================================================
    }
    // 6. Mempersiapkan payload data untuk disimpan ke database
    const payload = {
      name,
      bank_account,
      qr_code: QrCodeRel,
      isActive: isActive,
    };

    // TAMBAHKAN BARIS INI UNTUK DEBUG
    console.log("PAYLOAD YANG AKAN DISIMPAN:", payload);

    // 7. Menyimpan data ke database menggunakan fungsi dari model
    const created = await CreateData(trx, payload);

    // 8. Mempersiapkan data yang akan dikirim sebagai respons
    // Ini dilakukan sebelum commit untuk menangkap error jika ada
    const responsePayload = {
      id: created.id,
      name: created.name,
      bank_account: created.bank_account,
      qr_code: created.qr_code ? buildPublicUrl(created.qr_code) : null,
      isActive: created.isActive,
      // Jika Anda tidak menggunakan timestamps, hapus baris createdAt
      // createdAt: created.createdAt
    };

    // 9. Commit transaksi HANYA JIKA semua langkah di atas berhasil
    await trx.commit();

    // 10. Mengirim respons sukses ke client
    return successResponse(
      res,
      201,
      "success",
      "Payment berhasil dibuat",
      false,
      null,
      responsePayload
    );
  } catch (error) {
    // 11. Jika terjadi error di titik mana pun dalam blok 'try', batalkan semua perubahan
    await trx.rollback();

    // TAMBAHKAN BARIS INI UNTUK MELIHAT DETAIL ERROR
    console.log("===== ERROR DETAIL =====");
    console.log(error);
    console.log("========================");

    // Hapus file yang terlanjur di-upload jika ada error
    if (newFileAbsPath) {
      await safeUnlink(newFileAbsPath);
    }

    // 12. Menangani error spesifik (seperti email/username duplikat)
    if (error instanceof Sequelize.UniqueConstraintError) {
      const field = error.errors[0]?.path;
      let message = "Data sudah terdaftar.";
      if (field === "name") message = "Nama metode pembayaran sudah terdaftar.";
      return errorResponse(res, 409, "error", message, false, null, null);
    }

    // 13. Mengirim respons error umum
    return errorResponse(
      res,
      400,
      "error",
      error.message || "Gagal membuat metode pembayaran.",
      false,
      null,
      null
    );
  }
};

// PUT /payments/:id -> Memperbarui metode pembayaran
export const updatePayment = async (req, res) => {
  const trx = await db.transaction();
  let newFileAbsPath = null;
  let oldRel = null;

  try {
    const { id } = req.params;
    const { name, bank_account, isActive } = req.body;

    // Langkah 1: Cari dan kunci baris di tabel 'categories' SAJA (tanpa include)
    const payment = await Payment.findOne({
      where: { id },
      transaction: trx,
      lock: true, // Opsi lock yang lebih sederhana dan aman
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    oldRel = payment.qr_code; // Simpan path file lama

    const payload = {
      name: name ?? payment.name,
      bank_account: bank_account ?? payment.bank_account,
      qr_code: oldRel,
      isActive: typeof isActive === "undefined" ? payment.isActive : isActive,
    };

    if (req.file) {
      newFileAbsPath = req.file.path;
      payload.qr_code = relFromPublic(req.file.path);
    }
    // Langkah 2: Lakukan update
    await payment.update(payload, { transaction: trx });

    // Langkah 3: Commit transaksi
    await trx.commit();

    // Hapus file lama setelah commit berhasil
    if (req.file && oldRel) {
      const oldAbs = path.join(
        process.cwd(),
        "public",
        oldRel.replace(/^\//, "")
      );
      await safeUnlink(oldAbs);
    }

    // Langkah 4: Ambil data terbaru yang lengkap (dengan role) untuk respons
    const updatedPayment = await GetDataById(id);

    return successResponse(
      res,
      200,
      "success",
      "Payment updated successfully",
      false,
      null,
      updatedPayment // Kirim data yang sudah lengkap dengan join
    );
  } catch (error) {
    await trx.rollback();
    if (newFileAbsPath) await safeUnlink(newFileAbsPath);

    if (error instanceof Sequelize.UniqueConstraintError) {
      return errorResponse(
        res,
        409,
        "error",
        "Nama metode pembayaran sudah terdaftar.",
        false,
        null,
        null
      );
    }
    return errorResponse(res, 400, "error", error.message, false, null, null);
  }
};

// DELETE /payments/:id -> Menghapus metode pembayaran
export const deletePayment = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;

    // Langkah 1: Cari dan kunci metode pembayaran di tabel 'payments' SAJA
    const payment = await Payment.findOne({
      where: { id },
      transaction: trx,
      lock: true,
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    const oldRel = payment.qr_code;

    // Langkah 2: Hapus data
    await payment.destroy({ transaction: trx, force: true });

    // Langkah 3: Commit transaksi
    await trx.commit();

    // Hapus file setelah commit
    if (oldRel) {
      const oldAbs = path.join(
        process.cwd(),
        "public",
        oldRel.replace(/^\//, "")
      );
      await safeUnlink(oldAbs);
    }

    return successResponse(
      res,
      200,
      "success",
      "Payment deleted successfully",
      false,
      null,
      null
    );
  } catch (error) {
    await trx.rollback();
    return errorResponse(res, 400, "error", error.message, false, null, null);
  }
};
