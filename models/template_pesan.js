// models/template_pesan.js
import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// TEMPLATE PESAN MODEL - PURE SCHEMA
// ========================================
const TemplatePesan = db.define("TemplatePesan", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  kategori_pesan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: "Kategori pesan ID tidak boleh kosong." }
    }
  },
  nama_template: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Nama template tidak boleh kosong." },
      len: {
        args: [3, 200],
        msg: "Nama template harus antara 3-200 karakter."
      }
    }
  },
  isi_pesan: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Isi pesan tidak boleh kosong." }
    }
  },
}, {
  tableName: "template_pesans",
  timestamps: true,
  freezeTableName: true,
  indexes: [
    { fields: ['kategori_pesan_id'] },
    { fields: ['nama_template'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
TemplatePesan.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  if (values.KategoriPesan) {
    values.kategori_pesan = {
      id: values.KategoriPesan.id,
      nama_kategori: values.KategoriPesan.nama_kategori
    };
    delete values.KategoriPesan;
  }
  
  return values;
};

// ========================================
// ASSOCIATIONS
// ========================================
TemplatePesan.associate = function(models) {
  TemplatePesan.belongsTo(models.KategoriPesan, {
    foreignKey: "kategori_pesan_id",
    as: "kategoriPesan"
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const templatePesanResponse = (templatePesan) => {
  if (!templatePesan) return null;
  return templatePesan.toJSON ? templatePesan.toJSON() : {
    id: templatePesan.id,
    kategori_pesan_id: templatePesan.kategori_pesan_id,
    nama_template: templatePesan.nama_template,
    isi_pesan: templatePesan.isi_pesan,
    kategori_pesan: templatePesan.kategori_pesan ? {
      id: templatePesan.kategori_pesan.id,
      nama_kategori: templatePesan.kategori_pesan.nama_kategori,
    } : null,
    createdAt: templatePesan.createdAt,
    updatedAt: templatePesan.updatedAt,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export async function GetDataList(pagination = {}, filter = {}) {
  const { default: KategoriPesan } = await import('./kategori_pesan.js');
  
  const limit = Number.parseInt(pagination.limit, 10) || 10;
  const page = Number.parseInt(pagination.page, 10) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter.search) {
    where[Op.or] = [
      { nama_template: { [Op.iLike]: `%${filter.search}%` } },
      { isi_pesan: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }
  if (filter.kategori_pesan_id) {
    where.kategori_pesan_id = filter.kategori_pesan_id;
  }

  const includeOptions = filter.includeKategori ? [
    { model: KategoriPesan, as: "kategoriPesan", attributes: ["id", "nama_kategori"] }
  ] : [];

  const { rows, count } = await TemplatePesan.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: includeOptions,
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
  const { default: KategoriPesan } = await import('./kategori_pesan.js');
  
  const includeOptions = options.includeKategori ? [
    { model: KategoriPesan, as: "kategoriPesan" }
  ] : [];
  
  return await TemplatePesan.findOne({
    where: { id },
    include: includeOptions,
    ...options,
  });
}

export async function CreateData(data, trx) {
  const item = await TemplatePesan.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat template pesan.');
  return item;
}

export async function UpdateData(id, data, trx) {
  const template = await TemplatePesan.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!template) throw new Error("Template pesan tidak ditemukan.");
  await template.update(data, { transaction: trx });
  return template;
}

export async function DeleteData(id, trx) {
  const template = await TemplatePesan.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!template) throw new Error("Template pesan tidak ditemukan.");
  await template.destroy({ force: true, transaction: trx });
  return { message: "Template pesan berhasil dihapus." };
}

export default TemplatePesan;
