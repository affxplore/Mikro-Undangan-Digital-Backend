import { DataTypes, Op } from 'sequelize';
import db from '../config/database.js';
import { buildPublicUrl } from '../helpers/files.js';

// ========================================
// TRX DETAIL MODEL - PURE SCHEMA
// ========================================
const TrxDetail = db.define('TrxDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  transaksi_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: "Transaksi ID tidak boleh kosong." }
    },
    comment: 'Foreign key ke tabel transaksis'
  },
  va: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Virtual Account number dari payment gateway'
  },
  img_proff: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Path relatif bukti transfer di storage'
  },
  total: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: "Total tidak boleh negatif."
      }
    },
    comment: 'Subtotal sebelum diskon'
  },
  grand_total: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: "Grand total tidak boleh negatif."
      }
    },
    comment: 'Total akhir setelah diskon'
  },
  metode_payment: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Metode payment tidak boleh kosong." }
    }
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Nama tidak boleh kosong." }
    }
  },
  no_wa: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Nomor WA tidak boleh kosong." },
      is: {
        args: /^(\+62|62|0)[0-9]{9,12}$/,
        msg: "Format nomor WA tidak valid."
      }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: { msg: "Email tidak valid." }
    }
  },
}, {
  modelName: 'Trx_details',
  tableName: 'trx_details',
  timestamps: false,
  underscored: true,
  freezeTableName: true,
  indexes: [
    { fields: ['transaksi_id'] },
    { fields: ['va'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
TrxDetail.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Convert img_proff path to public URL
  if (values.img_proff) {
    values.img_proff = buildPublicUrl(values.img_proff);
  }
  
  // Format amounts
  values.total_formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(values.total);
  
  values.grand_total_formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(values.grand_total);
  
  // Calculate discount
  values.discount_amount = values.total - values.grand_total;
  
  return values;
};

TrxDetail.prototype.hasProof = function() {
  return !!this.img_proff;
};

TrxDetail.prototype.hasVA = function() {
  return !!this.va;
};

TrxDetail.prototype.getDiscountAmount = function() {
  return this.total - this.grand_total;
};

// ========================================
// ASSOCIATIONS
// ========================================
TrxDetail.associate = function(models) {
  TrxDetail.belongsTo(models.Transaksi, {
    foreignKey: 'transaksi_id',
    as: 'transaksi'
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const trxDetailResponse = (detail) => {
  if (!detail) return null;
  return detail.toJSON ? detail.toJSON() : {
    id: detail.id,
    transaksi_id: detail.transaksi_id,
    va: detail.va,
    img_proff: detail.img_proff ? buildPublicUrl(detail.img_proff) : null,
    total: detail.total,
    grand_total: detail.grand_total,
    metode_payment: detail.metode_payment,
    nama: detail.nama,
    no_wa: detail.no_wa,
    email: detail.email,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil detail transaksi berdasarkan ID
 * @param {number} id - ID TrxDetail
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  return await TrxDetail.findOne({
    where: { id },
    ...options
  });
}

/**
 * Mengambil detail berdasarkan transaksi_id
 * @param {number} transaksi_id - ID Transaksi
 */
export async function GetByTransaksiId(transaksi_id) {
  return await TrxDetail.findOne({
    where: { transaksi_id }
  });
}

/**
 * Membuat detail transaksi baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data detail transaksi
 */
export async function CreateData(trx, data) {
  const item = await TrxDetail.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat detail transaksi.');
  return item;
}

/**
 * Memperbarui detail transaksi berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID TrxDetail
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateData(trx, id, data) {
  const item = await TrxDetail.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error('Detail transaksi tidak ditemukan.');
  await item.update(data, { transaction: trx });
  return item;
}

/**
 * Menghapus detail transaksi berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID TrxDetail
 */
export async function DeleteData(trx, id) {
  const item = await TrxDetail.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error('Detail transaksi tidak ditemukan.');
  await item.destroy({ force: true, transaction: trx });
  return { message: 'Detail transaksi berhasil dihapus.' };
}

export default TrxDetail;
