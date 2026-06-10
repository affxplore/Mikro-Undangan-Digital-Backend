import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// PRICE MODEL - PURE SCHEMA
// ========================================
const Price = db.define(
  "Price",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Subscription ID tidak boleh kosong." }
      },
      comment: "Foreign key ke tabel subscriptions"
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: "Amount tidak boleh negatif."
        }
      },
      comment: "Harga dalam nominal terkecil (Rupiah)"
    },
    interval: {
      type: DataTypes.STRING("day", "week", "month", "year"),
      allowNull: false,
      validate: {
        isIn: {
          args: [["day", "week", "month", "year"]],
          msg: "Interval harus: day, week, month, atau year."
        }
      },
      comment: "Interval penagihan"
    },
  },
  {
    modelName: 'Price',
    tableName: "prices",
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    indexes: [
      { fields: ['subscription_id'] },
      { fields: ['interval'] }
    ]
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
Price.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Format amount to rupiah
  if (values.amount) {
    values.amount_formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(values.amount);
  }
  
  // Format subscription jika ada
  if (values.subscription) {
    values.subscription = {
      id: values.subscription.id,
      slug: values.subscription.slug,
      name: values.subscription.name,
    };
  }
  
  return values;
};

Price.prototype.isMonthly = function() {
  return this.interval === 'month';
};

Price.prototype.isYearly = function() {
  return this.interval === 'year';
};

Price.prototype.getFormattedAmount = function() {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(this.amount);
};

Price.prototype.getIntervalLabel = function() {
  const labels = {
    day: 'Harian',
    week: 'Mingguan',
    month: 'Bulanan',
    year: 'Tahunan'
  };
  return labels[this.interval] || this.interval;
};

// ========================================
// ASSOCIATIONS
// ========================================
Price.associate = function(models) {
  Price.belongsTo(models.Subscription, { 
    foreignKey: 'subscription_id', 
    as: 'subscription' 
  });
};
// ========================================
// RESPONSE FORMATTER
// ========================================
export const priceResponse = (price) => {
  if (!price) return null;
  return price.toJSON ? price.toJSON() : {
    id: price.id,
    subscription_id: price.subscription_id,
    amount: price.amount,
    interval: price.interval,
    createdAt: price.createdAt,
    updatedAt: price.updatedAt,
    subscription: price.subscription
      ? {
          id: price.subscription.id,
          slug: price.subscription.slug,
          name: price.subscription.name,
        }
      : null,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar price dengan paginasi dan filter
 * @param {{page: number, limit: number, sort?: string}} pagination - Opsi paginasi
 * @param {{subscription_id?: number}} filter - Opsi filter
 */
export async function GetDataList(pagination, filter) {
  const { default: Subscription } = await import('./subscription.js');
  
  const limit = Number.parseInt(pagination?.limit) || 10;
  const page = Number.parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter?.subscription_id) {
    where.subscription_id = filter.subscription_id;
  }

  const ALLOWED_SORT_FIELDS = new Set(["createdAt", "amount", "interval"]);
  let order = [["amount", "ASC"]];

  if (typeof pagination?.sort === "string") {
    const [fieldRaw, dirRaw] = pagination.sort.split(":");
    const field = fieldRaw?.trim();
    const dir = (dirRaw || "").toUpperCase() === "DESC" ? "DESC" : "ASC";

    if (field && ALLOWED_SORT_FIELDS.has(field)) {
      order = [[field, dir]];
    }
  }

  const { rows, count } = await Price.findAndCountAll({
    where,
    limit,
    offset,
    order,
    include: {
      model: Subscription,
      as: "subscription",
      attributes: ["id", "slug", "name"],
    },
  });

  return {
    priceList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil price berdasarkan ID
 * @param {number} id - ID Price
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  const { default: Subscription } = await import('./subscription.js');
  
  return await Price.findOne({
    where: { id },
    include: options.include !== false ? {
      model: Subscription,
      as: "subscription",
      attributes: ["id", "slug", "name"],
    } : undefined,
    ...options,
  });
}

/**
 * Membuat price baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data price baru
 */
export async function CreateData(trx, data) {
  const item = await Price.create(data, { transaction: trx });
  if (!item) throw new Error("Gagal membuat price.");
  return item;
}

/**
 * Memperbarui price berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Price
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateData(trx, id, data) {
  const item = await Price.findByPk(id, { 
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error("Price tidak ditemukan.");
  return await item.update(data, { transaction: trx });
}

/**
 * Menghapus price berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Price
 */
export async function DeleteData(trx, id) {
  const item = await Price.findByPk(id, { 
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error("Price tidak ditemukan.");
  await item.destroy({ transaction: trx });
  return { message: "Price berhasil dihapus." };
}

export default Price;