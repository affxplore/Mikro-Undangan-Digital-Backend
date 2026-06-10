import { Sequelize, DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// SUBSCRIPTION MODEL - PURE SCHEMA
// ========================================
const Subscription = db.define(
  "Subscription",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: "Kode/slug untuk paket ini sudah ada.",
      },
      validate: {
        notEmpty: { msg: "Slug tidak boleh kosong." },
        isLowercase: { msg: "Slug harus huruf kecil." },
        is: {
          args: /^[a-z0-9-]+$/,
          msg: "Slug hanya boleh mengandung huruf kecil, angka, dan dash."
        }
      },
      comment: "Kode unik untuk identifikasi paket, misal: 'paket-pro'.",
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Nama paket tidak boleh kosong." },
        len: {
          args: [3, 100],
          msg: "Nama paket harus antara 3-100 karakter."
        }
      },
      comment: "Nama paket yang ditampilkan ke pengguna, misal: 'Paket Pro'.",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Deskripsi tidak boleh kosong." }
      }
    },
    invitation_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Limit undangan tidak boleh negatif."
        }
      },
      comment: "Batas jumlah undangan aktif yang diizinkan.",
    },
    allow_branding_removal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Apakah paket ini mengizinkan pengguna menghapus branding.",
    },
  },
  {
    tableName: "subscriptions",
    timestamps: true,
    freezeTableName: true,
    indexes: [
      { fields: ['slug'], unique: true },
      { fields: ['name'] }
    ]
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
Subscription.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Format prices jika ada
  if (values.prices) {
    values.prices = values.prices.map(p => ({
      id: p.id,
      amount: p.amount,
      interval: p.interval,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));
  }
  
  return values;
};

Subscription.prototype.isFree = function() {
  return this.slug === 'free' || this.slug === 'paket-gratis';
};

Subscription.prototype.allowsBrandingRemoval = function() {
  return this.allow_branding_removal === true;
};

Subscription.prototype.getInvitationLimit = function() {
  return this.invitation_limit;
};

Subscription.prototype.hasUnlimitedInvitations = function() {
  return this.invitation_limit === -1 || this.invitation_limit >= 999999;
};

// ========================================
// ASSOCIATIONS
// ========================================
Subscription.associate = function(models) {
  Subscription.hasMany(models.Price, { 
    foreignKey: "subscription_id", 
    as: "prices" 
  });
  
  Subscription.hasMany(models.User, {
    foreignKey: 'subscription_id',
    as: 'users'
  });
};
// ========================================
// RESPONSE FORMATTER
// ========================================
export const subscriptionResponse = (subscription) => {
  if (!subscription) return null;
  return subscription.toJSON ? subscription.toJSON() : {
    id: subscription.id,
    slug: subscription.slug,
    name: subscription.name,
    description: subscription.description,
    invitation_limit: subscription.invitation_limit,
    allow_branding_removal: subscription.allow_branding_removal,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    prices: subscription.prices
      ? subscription.prices.map((p) => ({
          id: p.id,
          amount: p.amount,
          interval: p.interval,
        }))
      : [],
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar subscription dengan paginasi dan pencarian
 * @param {{page: number, limit: number, sort?: string}} pagination - Opsi paginasi
 * @param {{search?: string}} filter - Opsi filter
 */
export async function GetDataList(pagination, filter) {
  const { default: Price } = await import('./price.js');
  
  const limit = Number.parseInt(pagination?.limit) || 10;
  const page = Number.parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter?.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filter.search}%` } },
      { slug: { [Op.like]: `%${filter.search}%` } },
    ];
  }

  const ALLOWED_SORT_FIELDS = new Set([
    "createdAt",
    "name",
    "slug",
    "updatedAt",
  ]);
  let order = [["name", "ASC"]];

  if (typeof pagination?.sort === "string") {
    const [fieldRaw, dirRaw] = pagination.sort.split(":");
    const field = fieldRaw?.trim();
    const dir = (dirRaw || "").toUpperCase() === "DESC" ? "DESC" : "ASC";

    if (field && ALLOWED_SORT_FIELDS.has(field)) {
      order = [[field, dir]];
    }
  }

  const { rows, count } = await Subscription.findAndCountAll({
    where,
    limit,
    offset,
    order,
    include: {
      model: Price,
      as: "prices",
    },
  });

  return {
    subscriptionList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil subscription berdasarkan ID
 * @param {number} id - ID Subscription
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  const { default: Price } = await import('./price.js');
  
  return await Subscription.findOne({
    where: { id },
    include: options.include !== false ? [{
      model: Price,
      as: 'prices'
    }] : undefined,
    ...options,
  });
}

/**
 * Membuat subscription baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data subscription baru
 */
export async function CreateData(trx, data) {
  const item = await Subscription.create(data, { transaction: trx });
  if (!item) throw new Error("Gagal membuat subscription.");
  return item;
}

/**
 * Memperbarui subscription berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Subscription
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateData(trx, id, data) {
  const item = await Subscription.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!item) throw new Error("Subscription tidak ditemukan.");
  await item.update(data, { transaction: trx });
  return item;
}

/**
 * Menghapus subscription berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Subscription
 */
export async function DeleteData(trx, id) {
  const item = await Subscription.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!item) throw new Error("Subscription tidak ditemukan.");
  await item.destroy({ force: true, transaction: trx });
  return { message: "Subscription berhasil dihapus." };
}

export default Subscription;
