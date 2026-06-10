// models/kategori_pesan.js
import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// KATEGORI PESAN MODEL - PURE SCHEMA
// ========================================
const KategoriPesan = db.define("KategoriPesan", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama_kategori: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: "Nama kategori tidak boleh kosong." },
      len: {
        args: [2, 100],
        msg: "Nama kategori harus antara 2-100 karakter."
      }
    }
  },
}, {
  modelName: 'Kategori_pesan',
  tableName: "kategori_pesans",
  timestamps: true,
  underscored: true,
  freezeTableName: true,
  indexes: [
    { unique: true, fields: ['nama_kategori'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
KategoriPesan.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Add template_pesans if included
  if (values.TemplatePesans) {
    values.template_pesans = values.TemplatePesans;
    delete values.TemplatePesans;
  }
  
  return values;
};

// ========================================
// ASSOCIATIONS
// ========================================
KategoriPesan.associate = function(models) {
  KategoriPesan.hasMany(models.TemplatePesan, {
    foreignKey: "kategori_pesan_id",
    as: "templatePesans"
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const kategoriPesanResponse = (kategori) => {
  if (!kategori) return null;
  return kategori.toJSON ? kategori.toJSON() : {
    id: kategori.id,
    nama_kategori: kategori.nama_kategori,
    createdAt: kategori.createdAt,
    updatedAt: kategori.updatedAt
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export async function GetDataList(pagination = {}, filter = {}) {
  const { default: TemplatePesan } = await import('./template_pesan.js');
  
  const limit = Number.parseInt(pagination.limit, 10) || 10;
  const page = Number.parseInt(pagination.page, 10) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter.search) {
    where.nama_kategori = { [Op.iLike]: `%${filter.search}%` };
  }

  const ALLOWED_SORT_FIELDS = new Set(["nama_kategori", "createdAt", "updatedAt"]);
  let order = [["nama_kategori", "ASC"]];

  if (typeof pagination.sort === "string") {
    const [fieldRaw, directionRaw] = pagination.sort.split(":");
    const field = fieldRaw?.trim();
    const direction = (directionRaw || "").toUpperCase() === "DESC" ? "DESC" : "ASC";
    if (field && ALLOWED_SORT_FIELDS.has(field)) {
      order = [[field, direction]];
    }
  }

  const includeOptions = filter.includeTemplates ? [
    { model: TemplatePesan, as: 'templatePesans', attributes: ['id', 'pesan'] }
  ] : [];

  const { rows, count } = await KategoriPesan.findAndCountAll({
    where,
    limit,
    offset,
    order,
    include: includeOptions
  });

  return {
    kategoriList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

export async function GetDataById(id, options = {}) {
  const { default: TemplatePesan } = await import('./template_pesan.js');
  
  const includeOptions = options.includeTemplates ? [
    { model: TemplatePesan, as: 'templatePesans' }
  ] : [];
  
  return await KategoriPesan.findOne({
    where: { id },
    include: includeOptions,
    ...options,
  });
}

export async function CreateData(data, trx) {
  const item = await KategoriPesan.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat kategori pesan.');
  return item;
}

export async function UpdateData(id, data, trx) {
  const kategori = await KategoriPesan.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!kategori) throw new Error("Kategori pesan tidak ditemukan.");
  await kategori.update(data, { transaction: trx });
  return kategori;
}

export async function DeleteData(id, trx) {
  const kategori = await KategoriPesan.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  if (!kategori) throw new Error("Kategori pesan tidak ditemukan.");
  await kategori.destroy({ force: true, transaction: trx });
  return { message: "Kategori pesan berhasil dihapus." };
}

export default KategoriPesan;
