/**
 * ================================================================================
 * TEMPLATE MODEL - Pure Schema Definition
 * ================================================================================
 */

import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";
import { buildPublicUrl } from "../helpers/files.js";

// ================================================================================
// MODEL DEFINITION
// ================================================================================

const Template = db.define("Template", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Judul template tidak boleh kosong' },
      len: { args: [3, 100], msg: 'Judul harus 3-100 karakter' },
    },
  },
  thumbnail_file: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Path ke file template (.html/.zip)",
  },
  thumbnail_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Path ke gambar preview (.png/.jpg)",
  },
  label: {
    type: DataTypes.ENUM("free", "premium"),
    allowNull: false,
    defaultValue: "free",
    validate: {
      isIn: {
        args: [["free", "premium"]],
        msg: 'Label harus free atau premium'
      },
    },
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "templates",
  timestamps: true,
  freezeTableName: true,
  indexes: [
    { fields: ["category_id"] },
    { fields: ["label"] },
    { fields: ["title"] },
  ],
});

// ================================================================================
// INSTANCE METHODS
// ================================================================================

Template.prototype.toJSON = function() {
  const values = { ...this.get() };
  // Transform paths to URLs
  if (values.thumbnail_image) {
    values.thumbnail_image = buildPublicUrl(values.thumbnail_image);
  }
  if (values.thumbnail_file) {
    values.thumbnail_file = buildPublicUrl(values.thumbnail_file);
  }
  return values;
};

Template.prototype.isPremium = function() {
  return this.label === 'premium';
};

// ================================================================================
// STATIC METHODS
// ================================================================================

Template.associate = function(models) {
  Template.belongsTo(models.Category, {
    foreignKey: "category_id",
    as: "category"
  });
  Template.hasMany(models.Project, {
    foreignKey: "template_id",
    as: "projects"
  });
};

// ================================================================================
// RESPONSE FORMATTER
// ================================================================================

export const templateResponse = (template) => {
  if (!template) return null;

  return {
    id: template.id,
    title: template.title,
    previewUrl: template.thumbnail_image
      ? buildPublicUrl(template.thumbnail_image)
      : null,
    fileUrl: template.thumbnail_file
      ? buildPublicUrl(template.thumbnail_file)
      : null,
    label: template.label,
    description: template.description,
    category: template.category ? {
      id: template.category.id,
      name: template.category.name
    } : null,
    category_id: template.category_id,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
};

// ================================================================================
// CRUD OPERATIONS
// ================================================================================

export async function GetDataList(pagination = {}, filter = {}) {
  const Category = (await import('./category.js')).default;
  const limit = parseInt(pagination.limit) || 10;
  const page = parseInt(pagination.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};

  // 🔎 Search
  if (filter.search) {
    const searchQuery = `%${filter.search}%`;
    where.title = { [Op.iLike]: searchQuery };
  }

  // 🎯 Category filter
  if (filter.category_id) {
    where.category_id = Number(filter.category_id);
  }

  // 🏷️ Label filter
  if (filter.label) {
    where.label = filter.label; // ENUM → "free" / "premium"
  }

  // ⏳ Sorting whitelist
  const ALLOWED_SORT_FIELDS = new Set(["id", "title", "label", "createdAt", "category_id"]);
  let order = [["createdAt", "DESC"]]; // default

  if (typeof pagination.sort === "string") {
    const [fieldRaw, dirRaw] = pagination.sort.split(":");
    const field = fieldRaw?.trim();
    const dir = (dirRaw || "").toUpperCase() === "ASC" ? "ASC" : "DESC";

    if (field && ALLOWED_SORT_FIELDS.has(field)) {
      order = [[field, dir]];
    }
  }

  const { rows, count } = await Template.findAndCountAll({
    where,
    limit,
    offset,
    order,
    include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    distinct: true,
  });

  return {
    rows: rows.map(templateResponse), // biar konsisten pake response mapper lo
    count,
    pagination: {
      totalRows: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      limit,
    },
  };
}

export async function GetDataById(id) {
  const Category = (await import('./category.js')).default;

  return await Template.findByPk(id, {
    include: [{
      model: Category,
      as: "category",
      attributes: ["id", "name"]
    }],
  });
}

export async function CreateData(data, trx) {
  const template = await Template.create(data, { transaction: trx });
  if (!template) throw new Error('Template creation failed');
  return template;
}

export async function UpdateData(id, data, trx) {
  const template = await Template.findByPk(id, { transaction: trx });
  if (!template) throw new Error("Template tidak ditemukan");
  await template.update(data, { transaction: trx });
  return template;
}

export async function DeleteData(id, trx) {
  const template = await Template.findByPk(id, { transaction: trx });
  if (!template) throw new Error("Template tidak ditemukan");
  
  const deletedFiles = {
    thumbnail_file: template.thumbnail_file,
    thumbnail_image: template.thumbnail_image
  };
  
  await template.destroy({ transaction: trx });
  return { message: 'Template deleted successfully', deletedFiles };
}

export default Template;
