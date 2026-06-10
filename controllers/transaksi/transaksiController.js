import db from "../../config/database.js";
import User from "../../models/user.js";
import Price from "../../models/price.js";
import Subscription from "../../models/subscription.js";
import midtransclient from "midtrans-client";
import Transaksi from "../../models/transaksi.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { Op } from "sequelize"; // Import Op for search operations

export const createSubscriptionPayment = async (req, res) => {
  console.log(
    "\n--- [PAYMENT LOG] Proses 'createSubscriptionPayment' Dimulai ---"
  );
  const { price_id } = req.body;
  const { id: user_id } = req.user;
  const trx = await db.transaction();

  try {
    // LOG 1: Melihat data yang diminta oleh frontend
    console.log(`[PAYMENT LOG] Data Masuk dari Frontend:`, {
      price_id,
      user_id,
    });

    const snap = new midtransclient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

    const user = await User.findByPk(user_id);
    const price = await Price.findByPk(price_id, {
      include: { model: Subscription, as: "subscription" }, // Gunakan 'as' sesuai relasi
    });

    // LOG 2: Melihat data yang berhasil diambil dari database
    console.log(
      "[PAYMENT LOG] Data User dari DB:",
      user ? user.toJSON() : "Tidak Ditemukan"
    );
    console.log(
      "[PAYMENT LOG] Data Harga dari DB:",
      price ? price.toJSON() : "Tidak Ditemukan"
    );

    if (!user || !price) {
      throw new Error("User atau detail harga tidak ditemukan.");
    }
    if (!user.email || !user.full_name || !user.whatsapp_number) {
      throw new Error(
        "Data nama, email, atau nomor WhatsApp pengguna tidak lengkap. Harap perbarui profil Anda."
      );
    }

    const no_trx = `SUB-${Date.now()}-${user_id}`;
    const amount = price.amount;
    const intervalDays = price.interval === "month" ? 30 : 365;
    const expires_at = new Date(
      Date.now() + intervalDays * 24 * 60 * 60 * 1000
    );

    const transactionPayload = {
      no_trx,
      user_id,
      user_name: user.full_name,
      user_email: user.email,
      subscription_id: price.subscription_id,
      subscription_name: price.subscription.name,
      price_id: price.id,
      amount,
      status: "pending",
      expires_at,
    };

    // LOG 3: Melihat payload yang akan disimpan ke tabel 'transaksis'
    console.log(
      "[PAYMENT LOG] Payload untuk tabel 'transaksis':",
      transactionPayload
    );
    await Transaksi.create(transactionPayload, { transaction: trx });

    const parameter = {
      transaction_details: { order_id: no_trx, gross_amount: amount },
      customer_details: {
        first_name: user.full_name,
        email: user.email,
        phone: user.whatsapp_number,
      },
    };

    // LOG 4: Melihat parameter yang dikirim ke Midtrans
    console.log("[PAYMENT LOG] Parameter untuk Midtrans:", parameter);
    const token = await snap.createTransactionToken(parameter);

    // LOG 5: Melihat token yang diterima dari Midtrans
    console.log("[PAYMENT LOG] Token diterima dari Midtrans:", token);

    await trx.commit();
    console.log(
      "[PAYMENT LOG] Transaksi di-commit. Mengirim respons sukses ke frontend."
    );
    successResponse(
      res,
      201,
      "success",
      "Token pembayaran berhasil dibuat",
      false,
      null,
      { token }
    );
  } catch (error) {
    await trx.rollback();
    console.error("[PAYMENT LOG] ERROR:", error.message);
    errorResponse(res, 400, "error", error.message);
  }
};

// export const createSubscriptionPayment = async (req, res) => {
//    console.log("\n--- [PAYMENT LOG] Proses 'createSubscriptionPayment' Dimulai ---");
//   const { price_id } = req.body;
//   const { id: user_id } = req.user;
//   const trx = await db.transaction();

//   try {
//      console.log(`[PAYMENT LOG] Data Masuk dari Frontend:`, { price_id, user_id });

//     const snap = new midtransclient.Snap({
//         isProduction: false,
//         serverKey: process.env.MIDTRANS_SERVER_KEY,
//         clientKey: process.env.MIDTRANS_CLIENT_KEY
//     });

//     const user = await User.findByPk(user_id);
// const price = await Price.findByPk(price_id, {
//     include: { model: Subscription, as: 'subscription' } // Gunakan 'as' sesuai relasi
// });
//   console.log("[PAYMENT LOG] Data User dari DB:", user ? user.toJSON() : "Tidak Ditemukan");
//     console.log("[PAYMENT LOG] Data Harga dari DB:", price ? price.toJSON() : "Tidak Ditemukan");

//     if (!user || !price) {
//       throw new Error("User atau detail harga tidak ditemukan.");
//     }
//     // Cek kelengkapan data user sebelum melanjutkan
//     if (!user.email || !user.full_name || !user.whatsapp_number) {
//       throw new Error("Data nama, email, atau nomor WhatsApp pengguna tidak lengkap. Harap perbarui profil Anda terlebih dahulu.");
//     }

//     const no_trx = `SUB-${Date.now()}-${user_id}`;
//     const amount = price.amount;
//     const intervalDays = price.interval === 'month' ? 30 : 365;
//     const expires_at = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

//     await Transaksi.create({
//         no_trx,
//         user_id,
//         user_name: user.full_name,
//         subscription_id: price.subscription_id,
//         subscription_name: price.subscription.name, // <-- Gunakan 'subscription' (huruf kecil)
//         price_id: price.id,
//         amount,
//         status: 'pending',
//         expires_at
//     }, { transaction: trx });

//     const parameter = {
//         transaction_details: { order_id: no_trx, gross_amount: amount },
//         customer_details: { first_name: user.full_name, email: user.email, phone: user.whatsapp_number }
//     };

//     const token = await snap.createTransactionToken(parameter);
//     await trx.commit();

//     successResponse(res, 201, "success", "Token pembayaran berhasil dibuat", false, null, { token });

//   } catch (error) {
//     await trx.rollback();
//     errorResponse(res, 400, "error", error.message);
//   }
// };

// export const createSubscriptionPayment = async (req, res) => {
//   const { price_id } = req.body;
//   const { id: user_id } = req.user;
//   const trx = await db.transaction();

//   try {
//     // 2. Inisialisasi Snap API Midtrans dari .env
//     const snap = new midtransclient.Snap({
//         isProduction: false,
//         serverKey: process.env.MIDTRANS_SERVER_KEY,
//         clientKey: process.env.MIDTRANS_CLIENT_KEY
//     });

//     const user = await User.findByPk(user_id);
//     const price = await Price.findByPk(price_id, {
//         include: { model: Subscription } // Ambil data subscription terkait
//     });

//     if (!user || !price) {
//         throw new Error("User atau detail harga tidak ditemukan.");
//     }

//     const no_trx = `SUB-${Date.now()}-${user_id}`;
//     const amount = price.amount;
//     const intervalDays = price.interval === 'month' ? 30 : 365;
//     const expires_at = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);

//     // 3. Buat transaksi di database Anda dengan status 'pending'
//     await Transaksi.create({
//         no_trx,
//         user_id,
//         user_name: user.full_name,
//         subscription_id: price.subscription_id,
//         subscription_name: price.Subscription.name, // Ambil nama dari relasi
//         price_id: price.id,
//         amount,
//         status: 'pending',
//         expires_at
//     }, { transaction: trx });

//     // 4. Siapkan parameter untuk dikirim ke Midtrans
//     const parameter = {
//         transaction_details: {
//             order_id: no_trx,
//             gross_amount: amount
//         },
//         customer_details: {
//             first_name: user.full_name,
//             email: user.email,
//             phone: user.whatsapp_number
//         }
//     };

//     // 5. Minta token transaksi ke Midtrans
//     const token = await snap.createTransactionToken(parameter);

//     await trx.commit();
//     successResponse(res, 201, "success", "Token pembayaran berhasil dibuat", false, null, { token });

//   } catch (error) {
//     await trx.rollback();
//     errorResponse(res, 400, "error", error.message);
//   }
// };

export const handleMidtransWebhook = async (req, res) => {
  const trx = await db.transaction();
  try {
    // Inisialisasi Core API client dari Midtrans
    const apiClient = new midtransclient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });

   const notificationJson = req.body;
    
    console.log("===== WEBHOOK DITERIMA =====");
    console.log(JSON.stringify(notificationJson, null, 2));

    // --- PERBAIKAN LOGIKA VERIFIKASI ---
    // 1. Ambil order_id dari notifikasi yang masuk
    const orderIdFromNotification = notificationJson.order_id;
    if (!orderIdFromNotification) {
      throw new Error("Webhook tidak memiliki order_id.");
    }
    
    // 2. Gunakan order_id tersebut untuk memverifikasi ke Midtrans
    const statusResponse = await apiClient.transaction.status(orderIdFromNotification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;
    // --- AKHIR PERBAIKAN ---

    console.log(`[Webhook] Verifikasi status untuk Order ID ${orderId}: ${transactionStatus}`);
    
    const localTransaction = await Transaksi.findOne({ where: { no_trx: orderId } });
    if (!localTransaction) {
        return res.status(200).send('Transaksi tidak ditemukan, notifikasi diabaikan.');
    }
    
    console.log(`[Webhook] Status transaksi lokal saat ini: ${localTransaction.status}`);

    if (localTransaction.status === 'pending') {
        if (transactionStatus == 'capture' || transactionStatus == 'settlement'){
            if (fraudStatus == 'accept') {
                await localTransaction.update({ status: 'success' }, { transaction: trx });
                
                const user = await User.findByPk(localTransaction.user_id);
                if(user) {
                  await user.update({
                      subscription_id: localTransaction.subscription_id,
                      subscription_expires_at: localTransaction.expires_at
                  }, { transaction: trx });
                  console.log(`[Webhook] Berhasil meng-upgrade user ID: ${user.id}`);
                }
            }
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire'){
            await localTransaction.update({ status: 'failed' }, { transaction: trx });
            console.log(`[Webhook] Status transaksi diupdate menjadi 'failed'.`);
        }
    } else {
      console.log(`[Webhook] Status lokal BUKAN 'pending' (${localTransaction.status}), update dilewati.`);
    }
    
    await trx.commit();
    res.status(200).send('Webhook berhasil diproses.');

  } catch (error) {
    await trx.rollback();
    console.error("===== WEBHOOK ERROR =====", error.message);
    res.status(500).send({ error: error.message });
  }
};

// Get all transactions
export const getAllTransaksi = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { no_trx: { [Op.iLike]: `%${search}%` } },
        { user_name: { [Op.iLike]: `%${search}%` } },
        { user_email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const result = await Transaksi.findAndCountAll({
      where,
      offset,
      limit,
      order: [["createdAt", "DESC"]],
    });
    const pagination = calculatePagination({ page, limit }, result.count);
    const data = result.rows;

    successResponse(
      res,
      200,
      "success",
      "Transactions retrieved successfully",
      true,
      pagination,
      data
    );
  } catch (error) {
    errorResponse(res, 500, "error", error.message);
  }
};

// Get transaction by ID
export const getTransaksiById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaksi = await Transaksi.findByPk(id);

    if (!transaksi) {
      return errorResponse(res, 404, "error", "Transaction not found");
    }
    successResponse(
      res,
      200,
      "success",
      "Transaction retrieved successfully",
      false,
      null,
      transaksi
    );
  } catch (error) {
    errorResponse(res, 500, "error", error.message);
  }
};

// Create new transaction
export const createTransaksi = async (req, res) => {
  const { price_id } = req.body;
  const { id: user_id } = req.user; // Assuming req.user is populated by an auth middleware
  const trx = await db.transaction();

  try {
    // 1. Ambil semua data sumber yang diperlukan
    const user = await User.findByPk(user_id);
    const price = await Price.findByPk(price_id, {
      include: { model: Subscription, as: "subscription" }, // Perlu join di sini untuk dapat nama paket
    });

    if (!user || !price || !price.subscription) {
      throw new Error("User, detail harga, atau langganan tidak ditemukan.");
    }

    // 2. Siapkan "kuitansi" dengan menyalin data
    const payload = {
      no_trx: `TRX-${Date.now()}-${user_id}`,
      user_id: user.id,
      user_name: user.full_name || user.username, // Assuming user has full_name or username
      user_email: user.email,
      subscription_id: price.subscription.id,
      subscription_name: price.subscription.name,
      price_id: price.id,
      amount: price.amount,
      status: "pending",
      // Assuming 'Price' model has a 'duration_days' field for calculating expiry
      expires_at: new Date(
        Date.now() + price.duration_days * 24 * 60 * 60 * 1000
      ),
    };

    // 3. Buat transaksi di database
    const newTransaksi = await Transaksi.create(payload, { transaction: trx });

    // 4. Lanjutkan ke proses payment gateway ...
    // ... (This part is left as a placeholder as it's outside the scope of the current request)

    await trx.commit();
    successResponse(
      res,
      201,
      "success",
      "Transaksi berhasil dibuat dan menunggu pembayaran.",
      false,
      null,
      newTransaksi
    );
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

// Update transaction
export const updateTransaksi = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    const result = await UpdateData(id, req.body, trx);
    await trx.commit();
    successResponse(
      res,
      200,
      "success",
      "Transaction updated successfully",
      false,
      null,
      transaksiResponse(result)
    );
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};

// Delete transaction (soft delete)
export const deleteTransaksi = async (req, res) => {
  const trx = await db.transaction();
  try {
    const { id } = req.params;
    await DeleteData(id, trx);
    await trx.commit();
    successResponse(res, 200, "success", "Transaction deleted successfully");
  } catch (error) {
    await trx.rollback();
    errorResponse(res, 400, "error", error.message);
  }
};
