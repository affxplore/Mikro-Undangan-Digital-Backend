// models/template_salam.js
import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// TEMPLATE SALAM MODEL - PURE SCHEMA
// ========================================
const TemplateSalam = db.define("TemplateSalam", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  kategori: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Kategori tidak boleh kosong." },
      len: {
        args: [2, 100],
        msg: "Kategori harus antara 2-100 karakter."
      }
    }
  },
  teks: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Teks tidak boleh kosong." }
    }
  },
}, {
  modelName: 'Template_salam',
  tableName: "template_salams",
  timestamps: true,
  underscored: true,
  freezeTableName: true,
  indexes: [
    { fields: ['kategori'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
TemplateSalam.prototype.toJSON = function() {
  return { ...this.get() };
};

// ========================================
// ASSOCIATIONS
// ========================================
TemplateSalam.associate = function(models) {
  // No relations
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const templateSalamResponse = (templateSalam) => {
  if (!templateSalam) return null;
  return templateSalam.toJSON ? templateSalam.toJSON() : {
    id: templateSalam.id,
    kategori: templateSalam.kategori,
    teks: templateSalam.teks,
    createdAt: templateSalam.createdAt,
    updatedAt: templateSalam.updatedAt,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export async function GetDataList(pagination = {}, filter = {}) {
  const limit = Number.parseInt(pagination.limit, 10) || 10;
  const page = Number.parseInt(pagination.page, 10) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter.search) {
    where[Op.or] = [
      { kategori: { [Op.iLike]: `%${filter.search}%` } },
      { teks: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }
  if (filter.kategori) {
    where.kategori = filter.kategori;
  }

  const { rows, count } = await TemplateSalam.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });

  return {
    data: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function GetDataById(id, options = {}) {
  return await TemplateSalam.findOne({
    where: { id },
    ...options,
  });
}

export async function CreateData(data, trx) {
  const item = await TemplateSalam.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat template salam.');
  return item;
}

export async function UpdateData(id, data, trx) {
  const templateSalam = await TemplateSalam.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!templateSalam) throw new Error("Template salam tidak ditemukan.");
  await templateSalam.update(data, { transaction: trx });
  return templateSalam;
}

export async function DeleteData(id, trx) {
  const templateSalam = await TemplateSalam.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!templateSalam) throw new Error("Template salam tidak ditemukan.");
  await templateSalam.destroy({ force: true, transaction: trx });
  return { message: "Template salam berhasil dihapus." };
}

export default TemplateSalam;
