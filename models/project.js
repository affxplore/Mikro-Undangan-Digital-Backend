// import { Sequelize, DataTypes, Op } from "sequelize";
// import db from "../config/database.js";
// import User from "./user.js"; // <-- Impor model User
// import Template from "./template.js"

// // Mendefinisikan model Project
// const Project = db.define(
//   "Project",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     template_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false, // Set false jika template wajib ada saat project dibuat
//       references: {
//         model: Template,
//         key: "id",
//       },
//     },
//     project_data: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//       comment: "Menyimpan data proyek dalam format JSON.",
//     },
//     // Definisi foreign key untuk user yang membuat
//     created_by: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: User,
//         key: "id",
//       },
//     },
//     // Definisi foreign key untuk user yang terakhir memperbarui
//     updated_by: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: User,
//         key: "id",
//       },
//     },
//   },
//   {
//     tableName: "projects",
//     timestamps: true,       // Tetap aktifkan untuk createdAt dan updatedAt bawaan Sequelize
//     createdAt: 'createdAt', // Gunakan kolom createdAt standar
//     updatedAt: 'updatedAt', // Gunakan kolom updatedAt standar
//     freezeTableName: true,
//   }
// );

// // // Mendefinisikan relasi/asosiasi
// Project.belongsTo(User, { foreignKey: "created_by", as: "creator" });
// Project.belongsTo(User, { foreignKey: "updated_by", as: "updater" });
// Project.belongsTo(Template, { foreignKey: "template_id", as: "template" }); // <-- Relasi baru ke Template

// // /**
// //  * Memformat output proyek untuk response API.
// //  * @param {Project} project - Instance model Project dari Sequelize.
// //  */
// export const projectResponse = (project) => {
//   if (!project) return null;

//   let parsedData = null;
//   try {
//     parsedData = JSON.parse(project.project_data);
//   } catch (e) {
//     parsedData = project.project_data;
//   }

//   return {
//     id: project.id,
//     template_id: project.template_id, // <-- Tampilkan ID template
//     project_data: parsedData,
//     // Menampilkan data user jika di-include
//     creator: project.creator ? {
//         id: project.creator.id,
//         full_name: project.creator.full_name,
//         email: project.creator.email
//     } : null,
//     updater: project.updater ? {
//         id: project.updater.id,
//         full_name: project.updater.full_name,
//         email: project.updater.email
//     } : null,
//      template: project.template ? {
//         id: project.template.id,
//         title: project.template.title,
//     } : null,
//     createdAt: project.createdAt,
//     updatedAt: project.updatedAt,
//   };
// };

// /**
//  * Mengambil daftar proyek dengan paginasi dan pencarian.
//  * @param {{page: number, limit: number}} pagination - Opsi paginasi.
//  * @param {{search?: string}} filter - Opsi filter.
//  */
// export async function GetDataList(pagination, filter) {
//   const limit = Number(pagination?.limit) || 10;
//   const page = Number(pagination?.page) || 1;
//   const offset = (page - 1) * limit;

//     const where = {};
//   if (filter?.search) {
//     where.project_data = { [Op.like]: `%${filter.search}%` };
//   }
//   if (filter?.created_by) { // Filter by user ID
//     where.created_by = filter.created_by;
//   }

//   const { rows, count } = await Project.findAndCountAll({
//     where,
//     limit,
//     offset,
//     order: [["updatedAt", "DESC"]],
//     // Sertakan data user yang berelasi
//     include: [
//       { model: User, as: 'creator', attributes: ['id', 'full_name'] }, // <-- TAMBAHKAN 'full_name'
//       { model: User, as: 'updater', attributes: ['id', 'full_name'] },  // <-- TAMBAHKAN 'full_name'
//     { model: Template, as: "template", attributes: ["id", "title"] } // <-- Include data template

//     ]
//   });
//   return {
//     data: rows,
//     totalRows: count,
//      totalRowsInPage: rows.length,
//     currentPage: page,
//     totalPages: Math.ceil(count / limit),
//   };
// }

// // Fungsi Create, Update, Delete tetap sama karena payload dikirim dari controller
// export async function CreateData(data, trx) {
//   return await Project.create(data, { transaction: trx });
// }

// export async function UpdateData(id, data, trx) {
//   const project = await Project.findByPk(id, { transaction: trx, lock: trx.LOCK.UPDATE });
//   if (!project) throw new Error("Proyek tidak ditemukan.");
//   await project.update(data, { transaction: trx });
//   return project;
// }


// export async function DeleteData(trx, id) {
//   const item = await Project.findOne({ where: { id }, transaction: trx, lock: trx?.LOCK?.UPDATE });
//   if (!item) throw new Error('Project not found');
//   await item.destroy({ force: true, transaction: trx });
//   return { message: 'Project deleted successfully' };
// }

// export default Project;
/**
 * ================================================================================
 * PROJECT MODEL - Pure Schema Definition
 * ================================================================================
 */

import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ================================================================================
// MODEL DEFINITION
// ================================================================================

const Project = db.define("Project", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  project_data: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: "Data proyek dalam format JSONB (customization)",
    defaultValue: {},
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: "projects",
  timestamps: true,
  freezeTableName: true,
  indexes: [
    { fields: ["template_id"] },
    { fields: ["created_by"] },
    { fields: ["updated_by"] },
  ],
});

// ================================================================================
// INSTANCE METHODS
// ================================================================================

Project.prototype.toJSON = function() {
  const values = { ...this.get() };
  // Parse JSONB if needed
  if (typeof values.project_data === 'string') {
    try {
      values.project_data = JSON.parse(values.project_data);
    } catch (e) {
      // Keep as is if parse fails
    }
  }
  return values;
};

// ================================================================================
// STATIC METHODS
// ================================================================================

Project.associate = function(models) {
  Project.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator"
  });
  Project.belongsTo(models.User, {
    foreignKey: "updated_by",
    as: "updater"
  });
  Project.belongsTo(models.Template, {
    foreignKey: "template_id",
    as: "template"
  });
  Project.hasOne(models.Invitation, {
    foreignKey: "project_id",
    as: "invitation"
  });
};

// ================================================================================
// RESPONSE FORMATTER
// ================================================================================

export const projectResponse = (project) => {
  if (!project) return null;

  let parsedData = project.project_data;
  if (typeof parsedData === 'string') {
    try {
      parsedData = JSON.parse(parsedData);
    } catch (e) {
      parsedData = project.project_data;
    }
  }

  return {
    id: project.id,
    template_id: project.template_id,
    project_data: parsedData,
    creator: project.creator ? {
      id: project.creator.id,
      full_name: project.creator.full_name,
      email: project.creator.email
    } : null,
    updater: project.updater ? {
      id: project.updater.id,
      full_name: project.updater.full_name,
      email: project.updater.email
    } : null,
    template: project.template ? {
      id: project.template.id,
      title: project.template.title
    } : null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};

// ================================================================================
// CRUD OPERATIONS
// ================================================================================

export async function GetDataList(pagination = {}, filter = {}) {
  const User = (await import('./user.js')).default;
  const Template = (await import('./template.js')).default;

  const limit = parseInt(pagination?.limit) || 10;
  const page = parseInt(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  
  if (filter?.created_by) {
    where.created_by = filter.created_by;
  }

  const include = [
    { model: User, as: "creator", attributes: ["id", "full_name"] },
    { model: User, as: "updater", attributes: ["id", "full_name"] },
    { model: Template, as: "template", attributes: ["id", "title"] },
  ];

  const { rows, count } = await Project.findAndCountAll({
    where,
    limit,
    offset,
    include,
    order: [["updatedAt", "DESC"]],
    distinct: true,
  });

  return {
    data: rows,
    totalRows: count,
  };
}

export async function GetDataById(id) {
  const User = (await import('./user.js')).default;
  const Template = (await import('./template.js')).default;

  return await Project.findByPk(id, {
    include: [
      { model: User, as: "creator", attributes: ["id", "full_name", "email"] },
      { model: User, as: "updater", attributes: ["id", "full_name", "email"] },
      { model: Template, as: "template", attributes: ["id", "title"] },
    ],
  });
}

export async function CreateData(data, trx) {
  const project = await Project.create(data, { transaction: trx });
  if (!project) throw new Error('Project creation failed');
  return project;
}

export async function UpdateData(id, data, trx) {
  const project = await Project.findByPk(id, {
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  
  if (!project) throw new Error("Project not found");
  await project.update(data, { transaction: trx });
  return project;
}

export async function DeleteData(trx, id) {
  const project = await Project.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  
  if (!project) throw new Error('Project not found');
  await project.destroy({ force: true, transaction: trx });
  return { message: 'Project deleted successfully' };
}

export default Project;