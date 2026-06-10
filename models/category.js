// import { Sequelize, DataTypes, Op } from "sequelize";
// import db from "../config/database.js";
// import { buildPublicUrl } from "../helpers/files.js"; // Helper untuk membuat URL publik

// // Mendefinisikan model Category
// const Category = db.define(
//   "Category",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//     img_icon: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//   },
//   {
//     tableName: "categories",
//     timestamps: true, 
//     freezeTableName: true,
//   }
// );

// // Template.belongsTo(Category, { foreignKey: "category_id", as: "category" });
// // Category.hasMany(Template, { foreignKey: "category_id", as: "templates" });


// export const categoryResponse = (category) => {
//   if (!category) return null;
  
//   return {
//     id: category.id,
//     name: category.name,
//     img_icon: category.img_icon ? buildPublicUrl(category.img_icon) : null,
//     createdAt: category.createdAt,
//     updatedAt: category.updatedAt,
//   };
// };

// /**
//  * Mengambil daftar kategori dengan paginasi, pencarian, dan pengurutan.
//  * @param {{page: number, limit: number, sort?: string}} pagination - Opsi paginasi.
//  * @param {{search?: string}} filter - Opsi filter.
//  */
// export async function GetDataList(pagination, filter) {
//   const limit = Number.parseInt(pagination?.limit) || 10;
//   const page = Number.parseInt(pagination?.page) || 1;
//   const offset = (page - 1) * limit;

//   const where = {};
  
//   // Aktifkan filter pencarian
//   if (filter?.search) {
//     where.name = { [Op.like]: `%${filter.search}%` };
//   }
  
//   // Whitelist untuk field yang boleh di-sort untuk keamanan
//   const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'name', 'updatedAt']);
//   let order = [['name', 'ASC']]; // Default order

//   // Aktifkan logika sorting
//   if (typeof pagination?.sort === 'string') {
//     const [fieldRaw, dirRaw] = pagination.sort.split(':');
//     const field = fieldRaw?.trim();
//     const dir = (dirRaw || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

//     if (field && ALLOWED_SORT_FIELDS.has(field)) {
//       order = [[field, dir]];
//     }
//   }

//   const { rows, count } = await Category.findAndCountAll({
//     where, // Gunakan kondisi where
//     limit,
//     offset,
//     order, // Gunakan order
//   });

//   return {
//     categoryList: rows,
//     totalRows: count,
//     totalRowsInPage: rows.length,
//     currentPage: page,
//     totalPages: Math.ceil(count / limit),
//   };
// }   

// export async function GetDataById(id, options = {}) {
//   return await Category.findOne({
//     where: { id },
//     ...options
//   });
// }


// export async function CreateData(trx, data) {
//   const item = await Category.create(data, { transaction: trx });
//   if (!item) throw new Error('Category creation failed');
//   return item;
// }

// export async function UpdateData(trx, id, data) {
//   const item = await Category.findOne({ where: { id }, transaction: trx, lock: trx?.LOCK?.UPDATE });
//   if (!item) throw new Error('Category not found');
//   await item.update(data, { transaction: trx });
//   return item;
// }

// export async function DeleteData(trx, id) {
//   const item = await Category.findOne({ where: { id }, transaction: trx, lock: trx?.LOCK?.UPDATE });
//   if (!item) throw new Error('Category not found');
//   await item.destroy({ force: true, transaction: trx });
//   return { message: 'Category deleted successfully' };
// }

// export default Category;

import { Sequelize, DataTypes, Op } from "sequelize";
import db from "../config/database.js";
import { buildPublicUrl } from "../helpers/files.js";

// ========================================
// CATEGORY MODEL - PURE SCHEMA
// ========================================
const Category = db.define(
  "Category",
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
        msg: "Nama kategori sudah ada."
      },
      validate: {
        notEmpty: { msg: "Nama kategori tidak boleh kosong." },
        len: {
          args: [2, 100],
          msg: "Nama kategori harus antara 2-100 karakter."
        }
      }
    },
    img_icon: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Path relatif icon kategori di storage"
    },
  },
  {
    tableName: "categories",
    timestamps: true,
    freezeTableName: true,
    indexes: [
      { fields: ['name'], unique: true }
    ]
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
Category.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Convert img_icon path to public URL
  if (values.img_icon) {
    values.img_icon = buildPublicUrl(values.img_icon);
  }
  
  // Format templates jika ada
  if (values.templates) {
    values.templates = values.templates.map(t => ({
      id: t.id,
      title: t.title,
      label: t.label,
      thumbnail: t.thumbnail ? buildPublicUrl(t.thumbnail) : null
    }));
  }
  
  return values;
};

Category.prototype.hasTemplates = function() {
  return this.templates && this.templates.length > 0;
};

Category.prototype.getTemplateCount = async function() {
  const { default: Template } = await import('./template.js');
  return await Template.count({ where: { category_id: this.id } });
};

// ========================================
// ASSOCIATIONS
// ========================================
Category.associate = function(models) {
  Category.hasMany(models.Template, { 
    foreignKey: "category_id", 
    as: "templates" 
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const categoryResponse = (category) => {
  if (!category) return null;
  return category.toJSON ? category.toJSON() : {
    id: category.id,
    name: category.name,
    img_icon: category.img_icon ? buildPublicUrl(category.img_icon) : null,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar kategori dengan paginasi dan pencarian
 * @param {{page: number, limit: number, sort?: string}} pagination - Opsi paginasi
 * @param {{search?: string}} filter - Opsi filter
 */
export async function GetDataList(pagination, filter) {
  const limit = Number.parseInt(pagination?.limit) || 10;
  const page = Number.parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter?.search) {
    where.name = { [Op.like]: `%${filter.search}%` };
  }
  
  const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'name', 'updatedAt']);
  let order = [['name', 'ASC']];

  if (typeof pagination?.sort === 'string') {
    const [fieldRaw, dirRaw] = pagination.sort.split(':');
    const field = fieldRaw?.trim();
    const dir = (dirRaw || '').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (field && ALLOWED_SORT_FIELDS.has(field)) {
      order = [[field, dir]];
    }
  }

  const { rows, count } = await Category.findAndCountAll({
    where,
    limit,
    offset,
    order,
  });

  return {
    categoryList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil kategori berdasarkan ID
 * @param {number} id - ID Category
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  return await Category.findOne({
    where: { id },
    ...options
  });
}

/**
 * Membuat kategori baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data kategori baru
 */
export async function CreateData(trx, data) {
  const item = await Category.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat kategori.');
  return item;
}

/**
 * Memperbarui kategori berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Category
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateData(trx, id, data) {
  const item = await Category.findOne({ 
    where: { id }, 
    transaction: trx, 
    lock: trx?.LOCK?.UPDATE 
  });
  if (!item) throw new Error('Kategori tidak ditemukan.');
  await item.update(data, { transaction: trx });
  return item;
}

/**
 * Menghapus kategori berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID Category
 */
export async function DeleteData(trx, id) {
  const item = await Category.findOne({ 
    where: { id }, 
    transaction: trx, 
    lock: trx?.LOCK?.UPDATE 
  });
  if (!item) throw new Error('Kategori tidak ditemukan.');
  await item.destroy({ force: true, transaction: trx });
  return { message: 'Kategori berhasil dihapus.' };
}

export default Category;