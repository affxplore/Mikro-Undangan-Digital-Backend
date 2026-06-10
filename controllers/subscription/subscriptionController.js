// import db from "../../config/database.js";
// import {
//   subscriptionResponse,
//   CreateData,
//   DeleteData,
//   GetDataList,
//   GetDataById,
//   UpdateData,
// } from "../../models/subscription.js";
// import Subscription from "../../models/subscription.js";
// import { successResponse, errorResponse } from "../../helpers/response.js";
// import { calculatePagination } from "../../helpers/paginate.js";
// import { Sequelize } from "sequelize";

// // GET /subscriptions -> Mengambil semua langganan dengan paginasi
// export const getAllSubscriptions = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, sort, filter } = req.query;

//     // filter bisa dikirim sebagai JSON string di query
//     let parsedFilter = {};
//     if (typeof filter === "string") {
//       try {
//         parsedFilter = JSON.parse(filter);
//       } catch {
//         parsedFilter = {};
//       }
//     } else if (typeof filter === "object" && filter !== null) {
//       parsedFilter = filter;
//     }

//     const pagination = {
//       page: parseInt(page, 10),
//       limit: parseInt(limit, 10),
//       sort: typeof sort === "string" ? sort : undefined,
//     };

//     const result = await GetDataList(pagination, parsedFilter);
//     const paginationData = calculatePagination(pagination, result.totalRows);

//     // Map profilePicture (relative) -> public URL

//     const withUrls = result.subscriptionList.map((u) => {
//       const plainSubscription = u.get({ plain: true });


//       return {
//         ...plainSubscription,
//         // img_icon: u.img_icon ? buildPublicUrl(u.img_icon) : null,
//       };
//     });

//     successResponse(
//       res,
//       200,
//       "success",
//       "Subscriptions retrieved successfully",
//       true,
//       paginationData,
//       withUrls
//     );
//    } catch (error) {
//     errorResponse(
//       res,
//       400,
//       "error",
//       error.message || "Failed to retrieve subscriptions",
//       false,
//       null,
//       null
//     );
//   }
// }
// // GET /subscriptions/:id -> Mengambil satu langganan berdasarkan ID
// export const getSubscriptionById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const subscription = await GetDataById(id);

//     if (!subscription) {
//       return errorResponse(
//         res,
//         404,
//         "error",
//         "Subscription not found",
//         false,
//         null,
//         null
//       );
//     }

//     const payload = {
//       ...subscription.get({ plain: true }),
//       // img_icon: subscription.img_icon ? buildPublicUrl(subscription.img_icon) : null,
//     };
//     successResponse(
//       res,
//       200,
//       "success",
//       "Subscription retrieved successfully",
//       false,
//       null,
//       payload
//     );
//   } catch (error) {
//     errorResponse(res, 400, "error", error.message, false, null, null);
//   }
// };

// // POST /subscriptions -> Membuat langganan baru
// export const createSubscription = async (req, res) => {
//   const trx = await db.transaction();
//   try {
//     const { name, cost, description } = req.body;
//     if (!name || !cost || !description) {
//       throw new Error("Semua field wajib diisi.");
//     }

//     const payload = { name, cost, description };
//     const created = await CreateData(trx, payload);

//     const responsePayload = {
//       id: created.id,
//       name: created.name,
//       cost: created.cost,
//       description: created.description,
//     };

//     await trx.commit();
//     return successResponse(res, 201, "success", "Langganan berhasil dibuat", false, null, responsePayload);

//   } catch (error) {
//     await trx.rollback();
    
//     if (error instanceof Sequelize.UniqueConstraintError) {
//       const field = error.errors[0]?.path;
//       let message = "Data sudah terdaftar.";
//       if (field === "name") message = "Nama langganan sudah terdaftar.";
//       return errorResponse(res, 409, "error", message);
//     }

//     return errorResponse(res, 400, "error", error.message || "Gagal membuat langganan.");
//   }
// };

// // PUT /subscriptions/:id -> Memperbarui langganan
// export const updateSubscription = async (req, res) => {
//   const { id } = req.params;
//   const { name, cost, description } = req.body;
//   const trx = await db.transaction();

//   try {
//     const subscription = await Subscription.findOne({
//       where: { id },
//       transaction: trx,
//       lock: true,
//     });

//     if (!subscription) {
//       throw new Error("Subscription not found");
//     }

//     const payload = {
//       name: name ?? subscription.name,
//       cost: cost ?? subscription.cost,
//       description: description ?? subscription.description,
//     };

//     await subscription.update(payload, { transaction: trx });
//     await trx.commit();

//   } catch (error) {
//     await trx.rollback();
//     if (error instanceof Sequelize.UniqueConstraintError) {
//       return errorResponse(res, 409, "error", "Nama langganan sudah terdaftar.");
//     }
//     return errorResponse(res, 400, "error", error.message);
//   }

//   // Kirim respons sukses di luar blok try...catch
//   const updatedSubscription = await GetDataById(id);
//   return successResponse(res, 200, "success", "Langganan berhasil diperbarui", false, null, updatedSubscription);
// };

// // DELETE /subscriptions/:id -> Menghapus langganan
// export const deleteSubscription = async (req, res) => {
//   const { id } = req.params;
//   const trx = await db.transaction();

//   try {
//     const subscription = await Subscription.findOne({
//       where: { id },
//       transaction: trx,
//       lock: true,
//     });

//     if (!subscription) {
//       throw new Error("Subscription not found");
//     }

//     await subscription.destroy({ transaction: trx, force: true });
//     await trx.commit();

//   } catch (error) {
//     await trx.rollback();
//     return errorResponse(res, 400, "error", error.message);
//   }

//   // Kirim respons sukses di luar blok try...catch
//   return successResponse(
//     res,
//     200,                          // -> meta.code
//     "success",                    // -> meta.status
//     "Langganan berhasil dihapus",      // -> meta.message (bisa diganti "")
//     false,                        // -> meta.isPaginated
//     null,                        // -> pagination
//     null                          // -> data
//   );
// };

// C:\project\node-mikro-undangan-be\controllers\subscription\subscriptionController.js

import db from "../../config/database.js";
import {
  subscriptionResponse,
  CreateData,
  DeleteData,
  GetDataList,
  GetDataById,
  UpdateData,
} from "../../models/subscription.js"; // Hanya import fungsi CRUD
import Subscription from "../../models/subscription.js";
import Price from "../../models/price.js";
import { successResponse, errorResponse } from "../../helpers/response.js";
import { calculatePagination } from "../../helpers/paginate.js";
import { validateSubscriptionData } from "../../helpers/validators.js";
import { Sequelize } from "sequelize";


export const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, filter } = req.query;

    let parsedFilter = {};
    if (filter) {
      try { parsedFilter = JSON.parse(filter); } catch { parsedFilter = {}; }
    }

    const pagination = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sort,
    };

    const result = await GetDataList(pagination, parsedFilter);
    const paginationData = calculatePagination(pagination, result.totalRows);

    // Sama seperti di userController: Controller bertanggung jawab memformat respons
    const formattedData = result.subscriptionList.map((sub) => ({
      id: sub.id,
      slug: sub.slug,
      name: sub.name,
      description: sub.description,
      invitation_limit: sub.invitation_limit,
      allow_branding_removal: sub.allow_branding_removal,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      // Sertakan data harga yang sudah di-join dari model
      prices: sub.prices ? sub.prices.map(p => ({ id: p.id, amount: p.amount, interval: p.interval })) : [],
    }));

    successResponse(res, 200, "success", "Subscriptions retrieved successfully", true, paginationData, formattedData);
  } catch (error) {
    errorResponse(res, 400, "error", error.message || "Failed to retrieve subscriptions");
  }
};
// // GET /subscriptions
// export const getAllSubscriptions = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, sort, filter } = req.query;

//     // --- LOGIKA PARSING YANG AMAN ---
//     let parsedFilter = {};
//     if (filter) { // Hanya parse jika 'filter' ada
//       try {
//         parsedFilter = JSON.parse(filter);
//       } catch (e) {
//         // Abaikan jika format JSON tidak valid, gunakan objek kosong
//         console.error("Filter JSON tidak valid:", filter);
//       }
//     }
//     // --- AKHIR LOGIKA PARSING ---

//     const result = await GetDataList({ page, limit, sort }, parsedFilter);
//     const paginationData = calculatePagination({ page, limit }, result.totalRows);
//     const data = result.subscriptionList.map(subscriptionResponse);

//     successResponse(res, 200, "success", "Paket langganan berhasil diambil", true, paginationData, data);
//   } catch (error) {
//     errorResponse(res, 500, "error", error.message);
//   }
// };

// GET /subscriptions/:id
export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await GetDataById(id, { include: 'prices' });
    if (!subscription) {
      return errorResponse(res, 404, "error", "Subscription not found");
    }
    successResponse(res, 200, "success", "Subscription berhasil diambil", false, null, subscriptionResponse(subscription));
  } catch (error) {
    errorResponse(res, 400, "error", error.message);
  }
};

// POST /subscriptions
export const createSubscription = async (req, res) => {
  let trx;
  try {
    // Validate request data structure
    const validation = validateSubscriptionData(req.body);
    if (!validation.isValid) {
      return errorResponse(
        res,
        400,
        "error",
        `Validation failed: ${validation.errors.join(', ')}`
      );
    }

    const {
      slug,
      name,
      description,
      invitation_limit,
      allow_branding_removal = false,
      prices = []
    } = req.body;

    // Start transaction
    trx = await db.transaction();

    // Create subscription
    const subscription = await CreateData(trx, {
      slug,
      name,
      description,
      invitation_limit,
      allow_branding_removal
    });

    // Create associated prices if any
    if (prices.length > 0) {
      const pricePromises = prices.map(price => {
        return Price.create({
          subscription_id: subscription.id,
          amount: price.amount,
          interval: price.interval
        }, { transaction: trx });
      });

      await Promise.all(pricePromises);
    }

    // Commit transaction
    await trx.commit();

    // Fetch created subscription with prices
    const createdWithPrices = await GetDataById(subscription.id, {
      include: 'prices'
    });

    return successResponse(
      res,
      201,
      "success",
      "Subscription created successfully",
      false,
      null,
      subscriptionResponse(createdWithPrices)
    );

  } catch (error) {
    // Rollback HANYA jika transaction belum selesai
    if (trx && !trx.finished) {
      await trx.rollback();
    }

    // Handle specific errors
    if (error instanceof Sequelize.UniqueConstraintError) {
      const field = error.errors[0]?.path || 'field';
      return errorResponse(
        res,
        409,
        "error",
        `Subscription ${field} already exists`
      );
    }

    // Log error for debugging
    console.error('Error creating subscription:', error);

    return errorResponse(
      res,
      400,
      "error",
      error.message || "Failed to create subscription"
    );
  }
};

// PUT /subscriptions/:id
export const updateSubscription = async (req, res) => {
  let trx;
  try {

    const {
      slug,
      name,
      description,
      invitation_limit,
      allow_branding_removal,
      prices //tangkap data prices dari req.body
    } = req.body;

    // Validate request data structure
    const validation = validateSubscriptionData(req.body, true);
    if (!validation.isValid) {
      return errorResponse(
        res,
        400,
        "error",
        `Validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Start transaction
    trx = await db.transaction();
    
    // Get current subscription with lock to prevent concurrent updates
    const subscription = await GetDataById(req.params.id, { 
      transaction: trx,
      lock: true,
      includePrices: false // Matikan join saat LOCK agar tidak error Postgres

    });

    if (!subscription) {
      await trx.rollback();
      return errorResponse(res, 404, "error", "Subscription not found");
    }

    // Update data with validation
    const updateData = {
      slug: slug || subscription.slug,
      name: name || subscription.name,
      description: description || subscription.description,
      invitation_limit: invitation_limit || subscription.invitation_limit,
      allow_branding_removal: allow_branding_removal !== undefined ? allow_branding_removal : subscription.allow_branding_removal
    };

    // Update with transaction
    await UpdateData(trx, subscription.id, updateData);

    // 3. LOGIKA UPDATE PRICES (Jika ada data prices yang dikirim)
    if (prices && Array.isArray(prices)) {
      // Hapus harga lama milik subscription ini
      await db.models.Price.destroy({
        where: { subscription_id: subscription.id },
        transaction: trx
      });


      // Masukkan harga baru
      if (prices.length > 0) {
        const pricesToInsert = prices.map(p => ({
          subscription_id: subscription.id,
          amount: p.amount,
          interval: typeof p.interval === 'object' ? p.interval.interval : p.interval
        }));

        await db.models.Price.bulkCreate(pricesToInsert, { transaction: trx });
      }
    }

    // Commit transaction
    await trx.commit();

    // Fetch updated data with associations
    const updatedSubscription = await GetDataById(subscription.id, { 
      include: 'prices'
    });

    const formattedData = subscriptionResponse(updateSubscription);

    return successResponse(
      res, 
      200, 
      "success", 
      "Subscription updated successfully", 
      false, 
      null, 
      subscriptionResponse(updatedSubscription)
    );

  } catch (error) {
    // Rollback HANYA jika transaction belum selesai
    if (trx && !trx.finished) {
      await trx.rollback();
    }

    // Handle specific errors
    if (error instanceof Sequelize.UniqueConstraintError) {
      const field = error.errors[0]?.path || 'field';
      return errorResponse(
        res, 
        409, 
        "error", 
        `Subscription ${field} already exists`
      );
    }

    // Log error for debugging
    console.error('Error updating subscription:', error);
    
    return errorResponse(
      res, 
      400, 
      "error", 
      error.message || "Failed to update subscription"
    );
  }
};

// DELETE /subscriptions/:id
export const deleteSubscription = async (req, res) => {
  const trx = await db.transaction();
  try {
    await DeleteData(trx, req.params.id);
    await trx.commit();
    return successResponse(res, 200, "success", "Subscription deleted successfully");
  } catch (error) {
    // Rollback HANYA jika transaction belum selesai
    if (!trx.finished) {
      await trx.rollback();
    }
    return errorResponse(res, 400, "error", error.message);
  }
};

// POST /api/v1/subscriptions/with-prices
export const createSubscriptionWithPrices = async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    // Validasi input
    const { slug, name, description, invitation_limit, allow_branding_removal, prices } = req.body;
    
    if (!slug || !name || !description) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Slug, name, dan description harus diisi');
    }

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Minimal satu harga harus ditambahkan');
    }

    // 1. Buat subscription terlebih dahulu
    const subscription = await Subscription.create({
      slug,
      name,
      description,
      invitation_limit: parseInt(invitation_limit) || 1,
      allow_branding_removal: Boolean(allow_branding_removal)
    }, { transaction });

    // 2. Buat prices untuk subscription ini
    const priceCreations = prices.map(price => ({
      subscription_id: subscription.id,
      amount: parseFloat(price.amount),
      interval: price.interval
    }));

    await Price.bulkCreate(priceCreations, { transaction });

    // 3. Commit transaction HANYA SEKALI di sini
    await transaction.commit();
    
    // 4. Fetch data lengkap untuk response (SETELAH commit)
    const createdSubscription = await Subscription.findByPk(subscription.id, {
      include: [{ model: Price, as: 'prices' }]
    });

    // 5. Return success response
    return successResponse(res, 201, 'success', 'Subscription berhasil dibuat', false, null, createdSubscription);

  } catch (error) {
    console.error('Error creating subscription with prices:', error);
    
    // Rollback HANYA jika transaction belum selesai
    if (!transaction.finished) {
      await transaction.rollback();
    }
    
    // Handle specific Sequelize errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path || 'field';
      let message = 'Data sudah ada.';
      
      if (field === 'slug') {
        message = 'Slug/kode subscription sudah digunakan. Silakan gunakan slug yang berbeda.';
      }
      
      return errorResponse(res, 409, message);
    }
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return errorResponse(res, 400, `Validation error: ${messages.join(', ')}`);
    }
    
    const errorDetail = process.env.NODE_ENV === 'development' ? error.message : null;
    return errorResponse(res, 500, 'Gagal membuat subscription', errorDetail);
  }
};

// PUT /api/v1/subscriptions/:id/with-prices
export const updateSubscriptionWithPrices = async (req, res) => {
  let transaction;
  // const transaction = await db.transaction();
  
  try {
    // 1. Update subscription
    const { id } = req.params;
    transaction = await db.transaction();

    await Subscription.update(subscriptionData, { 
      where: { id },
      transaction 
    });

    // 2. Hapus prices lama dan buat yang baru (jika ada)
    if (prices && Array.isArray(proces)) {
      await Price.destroy({ 
        where: { subscription_id: id },
        transaction 
      });

      if (prices.length > 0) {
        const priceCreations = req.body.prices.map(price => ({
          subscription_id: id,
          amount: parseFloat(price.amount),
          interval: typeof price.interval === 'object' ? price.interval.interval : price.interval
        }));

        await Price.bulkCreate(priceCreations, { transaction });
      }
    }

    // 3. Commit HANYA SEKALI
    await transaction.commit();

    // 4. Return updated data
    const updatedSubscription = await Subscription.findByPk(id, {
      include: [{ model: Price, as: 'prices' }]
    });

    return successResponse(res, 200, 'success', 'Subscription berhasil diupdate', false, null, updatedSubscription);

} catch (error) {
    console.error('Error updating subscription:', error);

    // 1. Rollback transaksi jika ada
    if (transaction) await transaction.rollback();

    // 2. Tentukan status default
    let statusCode = 500;
    let message = 'Gagal mengupdate subscription';
    let errorDetails = null;

    // 3. Handle specific Sequelize errors (Tanpa mengubah logika pesan)
    if (error.name === 'SequelizeUniqueConstraintError') {
      statusCode = 409;
      const field = error.errors[0]?.path || 'field';
      message = 'Data sudah ada.';
      
      if (field === 'slug') {
        message = 'Slug/kode subscription sudah digunakan. Silakan gunakan slug yang berbeda.';
      }
      errorDetails = error.errors; // Sertakan detail error asli
    } 
    else if (error.name === 'SequelizeValidationError') {
      statusCode = 400;
      const messages = error.errors.map(err => err.message);
      message = `Validation error: ${messages.join(', ')}`;
      errorDetails = error.errors;
    }
    // Jika ada error message manual dari logic di atas catch
    else if (error.message) {
      message = error.message;
    }

    // 4. Samakan Format pemanggilan (res, statusCode, message, errors)
    // Sesuai dengan NEW FORMAT pada helper errorResponse kamu
    return errorResponse(res, statusCode, message, errorDetails);
  }
};