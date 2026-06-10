// models/transaksi.js

import { DataTypes, Op } from 'sequelize';
import db from '../config/database.js';

// ========================================
// TRANSAKSI MODEL - PURE SCHEMA
// ========================================
const Transaksi = db.define('Transaksi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  no_trx: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      msg: "Nomor transaksi sudah ada."
    },
    validate: {
      notEmpty: { msg: "Nomor transaksi tidak boleh kosong." }
    }
  },
  
  // --- Informasi Pengguna (Snapshot) ---
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID user yang melakukan transaksi, untuk referensi.'
  },
  user_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Nama user tidak boleh kosong." }
    },
    comment: 'Snapshot nama user pada saat transaksi.'
  },
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: { msg: "Email tidak valid." }
    },
    comment: 'Snapshot email user pada saat transaksi.'
  },

  // --- Informasi Langganan (Snapshot) ---
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID paket langganan yang dibeli, untuk referensi.'
  },
  subscription_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Nama subscription tidak boleh kosong." }
    },
    comment: 'Snapshot nama paket pada saat transaksi.'
  },
  price_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID harga spesifik (bulanan/tahunan) yang dipilih.'
  },

  // --- Informasi Pembayaran ---
  amount: {
    type: DataTypes.BIGINT,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: "Amount tidak boleh negatif."
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'expired'),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'success', 'failed', 'expired']],
        msg: "Status harus: pending, success, failed, atau expired."
      }
    }
  },
  payment_gateway_details: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON details dari payment gateway'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: "Expires at harus berupa tanggal valid." }
    }
  }
}, {
  modelName: 'Transaksi',
  tableName: 'transaksis',
  timestamps: true,
  underscored: true,
  freezeTableName: true,
  indexes: [
    { fields: ['no_trx'], unique: true },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['expires_at'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
Transaksi.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Parse payment_gateway_details jika JSON string
  if (values.payment_gateway_details && typeof values.payment_gateway_details === 'string') {
    try {
      values.payment_gateway_details = JSON.parse(values.payment_gateway_details);
    } catch (e) {
      // Keep as string if not valid JSON
    }
  }
  
  // Format amount
  values.amount_formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(values.amount);
  
  // Add status info
  values.is_expired = this.isExpired();
  values.is_success = this.isSuccess();
  values.is_pending = this.isPending();
  
  return values;
};

Transaksi.prototype.isPending = function() {
  return this.status === 'pending';
};

Transaksi.prototype.isSuccess = function() {
  return this.status === 'success';
};

Transaksi.prototype.isFailed = function() {
  return this.status === 'failed';
};

Transaksi.prototype.isExpired = function() {
  if (this.status === 'expired') return true;
  return new Date() > new Date(this.expires_at);
};

Transaksi.prototype.markAsSuccess = async function(trx) {
  this.status = 'success';
  await this.save({ transaction: trx });
};

Transaksi.prototype.markAsFailed = async function(trx) {
  this.status = 'failed';
  await this.save({ transaction: trx });
};

Transaksi.prototype.markAsExpired = async function(trx) {
  this.status = 'expired';
  await this.save({ transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
Transaksi.associate = function(models) {
  // Transaksi has one detail
  Transaksi.hasOne(models.TrxDetail, {
    foreignKey: 'transaksi_id',
    as: 'detail'
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const transaksiResponse = (transaksi) => {
  if (!transaksi) return null;
  return transaksi.toJSON ? transaksi.toJSON() : {
    id: transaksi.id,
    no_trx: transaksi.no_trx,
    user_id: transaksi.user_id,
    user_name: transaksi.user_name,
    user_email: transaksi.user_email,
    subscription_id: transaksi.subscription_id,
    subscription_name: transaksi.subscription_name,
    price_id: transaksi.price_id,
    amount: transaksi.amount,
    status: transaksi.status,
    payment_gateway_details: transaksi.payment_gateway_details,
    expires_at: transaksi.expires_at,
    createdAt: transaksi.createdAt,
    updatedAt: transaksi.updatedAt,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar transaksi dengan paginasi dan filter
 * @param {{page: number, limit: number, sort?: string}} pagination - Opsi paginasi
 * @param {{user_id?: number, status?: string}} filter - Opsi filter
 */
export async function GetDataList(pagination, filter) {
  const { default: TrxDetail } = await import('./trxDetail.js');
  
  const limit = Number.parseInt(pagination?.limit) || 10;
  const page = Number.parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  
  if (filter?.user_id) {
    where.user_id = filter.user_id;
  }
  
  if (filter?.status) {
    where.status = filter.status;
  }
  
  const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'amount', 'status', 'expires_at']);
  let order = [['createdAt', 'DESC']];

  if (typeof pagination?.sort === 'string') {
    const [fieldRaw, dirRaw] = pagination.sort.split(':');
    const field = fieldRaw?.trim();
    const dir = (dirRaw || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (field && ALLOWED_SORT_FIELDS.has(field)) {
      order = [[field, dir]];
    }
  }

  const { rows, count } = await Transaksi.findAndCountAll({
    where,
    limit,
    offset,
    order,
    include: [{
      model: TrxDetail,
      as: 'detail'
    }]
  });

  return {
    transaksiList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil transaksi berdasarkan ID
 * @param {number} id - ID Transaksi
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  const { default: TrxDetail } = await import('./trxDetail.js');
  
  return await Transaksi.findOne({
    where: { id },
    include: options.include !== false ? [{
      model: TrxDetail,
      as: 'detail'
    }] : undefined,
    ...options
  });
}

/**
 * Mengambil transaksi berdasarkan nomor transaksi
 * @param {string} no_trx - Nomor transaksi
 */
export async function GetByNoTrx(no_trx) {
  const { default: TrxDetail } = await import('./trxDetail.js');
  
  return await Transaksi.findOne({
    where: { no_trx },
    include: [{
      model: TrxDetail,
      as: 'detail'
    }]
  });
}

/**
 * Membuat transaksi baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data transaksi baru
 */
export async function CreateData(trx, data) {
  const item = await Transaksi.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat transaksi.');
  return item;
}

/**
 * Memperbarui transaksi berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Transaksi
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateData(trx, id, data) {
  const item = await Transaksi.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error('Transaksi tidak ditemukan.');
  await item.update(data, { transaction: trx });
  return item;
}

/**
 * Menghapus transaksi berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Transaksi
 */
export async function DeleteData(trx, id) {
  const item = await Transaksi.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error('Transaksi tidak ditemukan.');
  await item.destroy({ force: true, transaction: trx });
  return { message: 'Transaksi berhasil dihapus.' };
}

export default Transaksi;