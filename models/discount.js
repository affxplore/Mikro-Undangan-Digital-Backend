import { Sequelize, DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// DISCOUNT MODEL - PURE SCHEMA
// ========================================
const Discount = db.define(
  "Discount",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Nama diskon tidak boleh kosong." },
        len: {
          args: [3, 100],
          msg: "Nama diskon harus antara 3-100 karakter."
        }
      }
    },
    promo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Nilai promo tidak boleh kosong." },
        isValidPromo(value) {
          // Validasi format: harus "X%" atau angka
          const percentageRegex = /^\d+%$/;
          const numberRegex = /^\d+$/;
          if (!percentageRegex.test(value) && !numberRegex.test(value)) {
            throw new Error('Format promo harus persentase (contoh: "15%") atau nominal (contoh: "10000").');
          }
        }
      },
      comment: 'Nilai diskon dalam format persentase (15%) atau nominal (10000)'
    },
    voucher: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: "Kode voucher sudah ada."
      },
      validate: {
        notEmpty: { msg: "Kode voucher tidak boleh kosong." },
        len: {
          args: [4, 50],
          msg: "Kode voucher harus antara 4-50 karakter."
        },
        isUppercase: {
          msg: "Kode voucher harus huruf besar."
        }
      }
    },
  },
  {
    modelName: 'Discount',
    tableName: "discounts",
    timestamps: true, 
    underscored: true,
    freezeTableName: true,
    indexes: [
      { fields: ['voucher'], unique: true },
      { fields: ['name'] }
    ]
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
Discount.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Add computed fields
  values.is_percentage = this.isPercentage();
  values.discount_value = this.getDiscountValue();
  
  return values;
};

Discount.prototype.isPercentage = function() {
  return this.promo.includes('%');
};

Discount.prototype.getDiscountValue = function() {
  if (this.isPercentage()) {
    return parseInt(this.promo.replace('%', ''));
  }
  return parseInt(this.promo);
};

Discount.prototype.calculateDiscount = function(amount) {
  if (this.isPercentage()) {
    const percentage = this.getDiscountValue();
    return Math.floor(amount * percentage / 100);
  }
  return this.getDiscountValue();
};

Discount.prototype.applyToAmount = function(amount) {
  const discountAmount = this.calculateDiscount(amount);
  return Math.max(0, amount - discountAmount);
};

// ========================================
// ASSOCIATIONS
// ========================================
Discount.associate = function(models) {
  // Discount bisa digunakan di banyak transaksi
  // Discount.hasMany(models.Transaksi, { foreignKey: 'discount_id', as: 'transactions' });
};
// ========================================
// RESPONSE FORMATTER
// ========================================
export const discountResponse = (discount) => {
  if (!discount) return null;
  return discount.toJSON ? discount.toJSON() : {
    id: discount.id,
    name: discount.name,
    promo: discount.promo,
    voucher: discount.voucher,
    createdAt: discount.createdAt,
    updatedAt: discount.updatedAt,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar diskon dengan paginasi dan pencarian
 * @param {{page: number, limit: number, sort?: string}} pagination - Opsi paginasi
 * @param {{search?: string, voucher?: string}} filter - Opsi filter
 */
export async function GetDataList(pagination, filter) {
  const limit = Number.parseInt(pagination?.limit) || 10;
  const page = Number.parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  
  // Filter pencarian (search di name atau voucher)
  if (filter?.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { voucher: { [Op.like]: `%${filter.search}%` } }
    ];
  }
  
  // Filter voucher spesifik
  if (filter?.voucher) {
    where.voucher = filter.voucher;
  }
    
  const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'name', 'voucher', 'updatedAt']);
  let order = [['createdAt', 'DESC']];

  if (typeof pagination?.sort === 'string') {
    const [fieldRaw, dirRaw] = pagination.sort.split(':');
    const field = fieldRaw?.trim();
    const dir = (dirRaw || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (field && ALLOWED_SORT_FIELDS.has(field)) {
      order = [[field, dir]];
    }
  }

  const { rows, count } = await Discount.findAndCountAll({
    where,
    limit,
    offset,
    order,
  });

  return {
    discountList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil discount berdasarkan ID
 * @param {number} id - ID Discount
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  return await Discount.findOne({
    where: { id },
    ...options
  });
}

/**
 * Mengambil discount berdasarkan kode voucher
 * @param {string} voucherCode - Kode voucher
 */
export async function GetByVoucherCode(voucherCode) {
  return await Discount.findOne({
    where: { voucher: voucherCode.toUpperCase() }
  });
}

/**
 * Membuat discount baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data discount baru
 */
export async function CreateData(trx, data) {
  // Uppercase voucher code
  if (data.voucher) {
    data.voucher = data.voucher.toUpperCase();
  }
  
  const item = await Discount.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat discount.');
  return item;
}

/**
 * Memperbarui discount berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Discount
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateData(trx, id, data) {
  // Uppercase voucher code
  if (data.voucher) {
    data.voucher = data.voucher.toUpperCase();
  }
  
  const item = await Discount.findOne({ 
    where: { id }, 
    transaction: trx, 
    lock: trx?.LOCK?.UPDATE 
  });
  if (!item) throw new Error('Discount tidak ditemukan.');
  await item.update(data, { transaction: trx });
  return item;
}

/**
 * Menghapus discount berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Discount
 */
export async function DeleteData(trx, id) {
  const item = await Discount.findOne({ 
    where: { id }, 
    transaction: trx, 
    lock: trx?.LOCK?.UPDATE 
  });
  if (!item) throw new Error('Discount tidak ditemukan.');
  await item.destroy({ force: true, transaction: trx });
  return { message: 'Discount berhasil dihapus.' };
}

export default Discount;