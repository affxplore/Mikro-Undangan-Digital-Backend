import { Sequelize, DataTypes, Op } from "sequelize";
import db from "../config/database.js";
import { buildPublicUrl } from "../helpers/files.js";

// ========================================
// PAYMENT MODEL - PURE SCHEMA
// ========================================
const Payment = db.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: "Nama payment sudah ada."
      },
      validate: {
        notEmpty: { msg: "Nama payment tidak boleh kosong." },
        len: {
          args: [2, 100],
          msg: "Nama payment harus antara 2-100 karakter."
        }
      }
    },
    bank_account: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Nomor rekening tidak boleh kosong." }
      }
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Path relatif QR code di storage"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
  },
  {
    modelName: 'Payment',
    tableName: "payments",
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['is_active'] }
    ]
  }
);

// ========================================
// INSTANCE METHODS
// ========================================

Payment.prototype.toJSON = function () {
  const values = { ...this.get() };

  if (values.qr_code) {
    values.qr_code = buildPublicUrl(values.qr_code);
  }

  return values;
};

// rename biar tidak konflik
Payment.prototype.isActiveStatus = function () {
  return this.isActive === true;
};

Payment.prototype.activate = async function (trx) {
  this.setDataValue("isActive", true);
  await this.save({ transaction: trx });
};

Payment.prototype.deactivate = async function (trx) {
  this.setDataValue("isActive", false);
  await this.save({ transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
Payment.associate = function(models) {
  // Payment dapat digunakan oleh banyak transaksi
  // Payment.hasMany(models.Transaksi, { foreignKey: 'payment_id', as: 'transactions' });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const paymentResponse = (payment) => {
  if (!payment) return null;
  return payment.toJSON ? payment.toJSON() : {
    id: payment.id,
    name: payment.name,
    bank_account: payment.bank_account,
    qr_code: payment.qr_code ? buildPublicUrl(payment.qr_code) : null,
    isActive: payment.isActive,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar payment dengan paginasi dan pencarian
 * @param {{page: number, limit: number, sort?: string}} pagination - Opsi paginasi
 * @param {{search?: string, status?: string}} filter - Opsi filter
 */
export async function GetDataList(pagination, filter) {
  const limit = Number.parseInt(pagination?.limit) || 10;
  const page = Number.parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};

  // Filter pencarian
  if (filter?.search) {
    const searchQuery = `%${filter.search}%`;
    where[Op.or] = [
      { name: { [Op.like]: searchQuery } },
      { bank_account: { [Op.like]: searchQuery } },
    ];
  }

  // Filter status (aktif/nonaktif)
  if (filter?.status === "true") {
    where.isActive = true;
  } else if (filter?.status === "false") {
    where.isActive = false;
  }

  const ALLOWED_SORT_FIELDS = new Set([
    "id",
    "name",
    "isActive",
    "createdAt",
    "updatedAt",
  ]);
  let order = [["id", "ASC"]];

  if (typeof pagination?.sort === "string" && pagination.sort) {
    const [fieldRaw, dirRaw] = pagination.sort.split(":");
    const field = fieldRaw?.trim();
    const dir = (dirRaw || "").toUpperCase() === "DESC" ? "DESC" : "ASC";

    if (field && ALLOWED_SORT_FIELDS.has(field)) {
      order = [[field, dir]];
    }
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    limit,
    offset,
    order,
  });

  return {
    paymentList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil payment berdasarkan ID
 * @param {number} id - ID Payment
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  return await Payment.findOne({
    where: { id },
    ...options,
  });
}

/**
 * Membuat payment baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data payment baru
 */
export async function CreateData(trx, data) {
  const item = await Payment.create(data, { transaction: trx });
  if (!item) throw new Error("Gagal membuat payment.");
  return item;
}

/**
 * Memperbarui payment berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Payment
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateData(trx, id, data) {
  const item = await Payment.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!item) throw new Error("Payment tidak ditemukan.");
  await item.update(data, { transaction: trx });
  return item;
}

/**
 * Menghapus payment berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Payment
 */
export async function DeleteData(trx, id) {
  const item = await Payment.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!item) throw new Error("Payment tidak ditemukan.");
  await item.destroy({ force: true, transaction: trx });
  return { message: "Payment berhasil dihapus." };
}

export default Payment;
