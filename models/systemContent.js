// models/systemContent.js
import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// SYSTEM CONTENT MODEL - PURE SCHEMA
// ========================================
const SystemContent = db.define("SystemContent", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: "Key tidak boleh kosong." }
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Title tidak boleh kosong." },
      len: {
        args: [3, 200],
        msg: "Title harus antara 3-200 karakter."
      }
    }
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Type tidak boleh kosong." }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "isactive"
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  config: {
    type: DataTypes.JSON,
    allowNull: true
  },
}, {
  tableName: "systemcontents",
  timestamps: true,
  freezeTableName: true,
  indexes: [
    { unique: true, fields: ['key'] },
    { fields: ['type'] },
    { fields: ['isactive'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
SystemContent.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Parse config if needed
  if (typeof values.config === 'string') {
    try {
      values.config = JSON.parse(values.config);
    } catch (e) {
      // Keep as string if parsing fails
    }
  }
  
  return values;
};

SystemContent.prototype.checkIsActive = function() {
  return this.isActive === true;
};

SystemContent.prototype.activate = async function(trx) {
  this.isActive = true;
  await this.save({ transaction: trx });
};

SystemContent.prototype.deactivate = async function(trx) {
  this.isActive = false;
  await this.save({ transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
SystemContent.associate = function(models) {
  // No relations for now
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const systemContentResponse = (content) => {
  if (!content) return null;
  return content.toJSON ? content.toJSON() : {
    id: content.id,
    key: content.key,
    title: content.title,
    type: content.type,
    isActive: content.isActive,
    content: content.content,
    config: content.config,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export async function GetDataList(pagination, filter) {
  const limit = Number(pagination?.limit) || 10;
  const page = Number(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};

  if (filter?.key) where.key = filter.key;
  
  if (filter?.search) {
    where[Op.or] = [
      { key: { [Op.iLike]: `%${filter.search}%` } },
      { title: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }
  
  if (filter?.status === "true") {
    where.isActive = true;
  } else if (filter?.status === "false") {
    where.isActive = false;
  }
  
  if (filter?.type) where.type = filter.type;

  const ALLOWED_SORT_FIELDS = new Set(['key', 'title', 'type', 'isActive', 'createdAt', 'updatedAt']);
  let order = [['createdAt', 'DESC']];

  if (pagination?.sort && typeof pagination.sort === 'string') {
    const [field, direction] = pagination.sort.split(':');
    const normalizedDir = (direction || '').toUpperCase();
    
    if (ALLOWED_SORT_FIELDS.has(field) && ['ASC', 'DESC'].includes(normalizedDir)) {
      order = [[field, normalizedDir]];
    }
  }

  const { rows, count } = await SystemContent.findAndCountAll({
    where,
    limit,
    offset,
    order,
  });

  return {
    data: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function GetDataById(id) {
  return await SystemContent.findByPk(id);
}

export async function GetByKey(key) {
  return await SystemContent.findOne({ where: { key } });
}

export async function CreateData(data, trx) {
  const item = await SystemContent.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat system content.');
  return item;
}

export async function UpdateData(id, data, trx) {
  const content = await SystemContent.findByPk(id, {
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!content) throw new Error("System content tidak ditemukan.");
  await content.update(data, { transaction: trx });
  return content;
}

export async function DeleteData(id, trx) {
  const content = await SystemContent.findByPk(id, {
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!content) throw new Error("System content tidak ditemukan.");
  await content.destroy({ transaction: trx });
  return { message: "System content berhasil dihapus." };
}

// /**
//  * Menghapus konten sistem berdasarkan ID.
//  * @param {number} id - ID Konten.
//  * @param {import("sequelize").Transaction} trx - Transaksi database.
//  */
// export async function DeleteData(id, trx) {
//   const content = await SystemContent.findByPk(id, { transaction: trx, lock: trx.LOCK.UPDATE });
//   if (!content) throw new Error("Konten tidak ditemukan.");
//   await content.destroy({ transaction: trx });
//   return content;
// }

export default SystemContent;
