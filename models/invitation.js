/**
 * ================================================================================
 * INVITATION MODEL - Pure Schema Definition
 * ================================================================================
 */

import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ================================================================================
// MODEL DEFINITION
// ================================================================================

const Invitation = db.define("Invitation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nama undangan tidak boleh kosong' },
      len: { args: [3, 100], msg: 'Nama harus 3-100 karakter' },
    },
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  acara: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'Format tanggal tidak valid' },
    },
  },
  place: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Lokasi tidak boleh kosong' },
    },
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    validate: {
      min: { args: [-180], msg: 'Longitude invalid' },
      max: { args: [180], msg: 'Longitude invalid' },
    },
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true,
    validate: {
      min: { args: [-90], msg: 'Latitude invalid' },
      max: { args: [90], msg: 'Latitude invalid' },
    },
  },
  owner_1: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Nama pemilik 1 tidak boleh kosong' },
    },
  },
  owner_2: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty(value) {
        if (value !== null && value !== "" && value.trim() === "") {
          throw new Error("Nama pemilik 2 tidak boleh kosong");
        }
      }
      // notEmpty: { msg: 'Nama pemilik 2 tidak boleh kosong' },
    },
  },
  no_hp: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("nonaktif", "aktif"),
    allowNull: false,
    defaultValue: "nonaktif",
    validate: {
      isIn: {
        args: [["nonaktif", "aktif"]],
        msg: 'Status harus nonaktif atau aktif'
      },
    },
  },
  template_pesan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  modelName: 'Invitation',
  tableName: "invitations",
  timestamps: true,
  underscored: true,
  freezeTableName: true,
  indexes: [
    { fields: ["project_id"] },
    { fields: ["template_pesan_id"] },
    { fields: ["status"] },
    { fields: ["acara"] },
  ],
});

// ================================================================================
// INSTANCE METHODS
// ================================================================================

Invitation.prototype.isActive = function() {
  return this.status === 'aktif';
};

Invitation.prototype.activate = function() {
  this.status = 'aktif';
  return this.save();
};

Invitation.prototype.deactivate = function() {
  this.status = 'nonaktif';
  return this.save();
};

// ================================================================================
// STATIC METHODS
// ================================================================================

Invitation.associate = function(models) {
  Invitation.belongsTo(models.Project, {
    foreignKey: "project_id",
    as: "project"
  });
  Invitation.belongsTo(models.TemplatePesan, {
    foreignKey: "template_pesan_id",
    as: "template_pesan"
  });
  Invitation.hasMany(models.ReceiveInv, {
    foreignKey: "invitation_id",
    as: "recipients"
  });
  Invitation.hasMany(models.UcapanTamu, {
    foreignKey: "invitation_id",
    as: "ucapan"
  });
};

// ================================================================================
// RESPONSE FORMATTER
// ================================================================================

export const invitationResponse = (invitation) => {
  if (!invitation) return null;

  return {
    id: invitation.id,
    project_id: invitation.project_id, // ← FIX: diperlukan untuk Edit & View di admin
    name: invitation.name,
    status: invitation.status,
    acara: invitation.acara,
    place: invitation.place,
    longitude: invitation.longitude,
    latitude: invitation.latitude,
    owner_1: invitation.owner_1,
    owner_2: invitation.owner_2,
    no_hp: invitation.no_hp,
    template_pesan_id: invitation.template_pesan_id,
    project: invitation.project ? {
      id: invitation.project.id,
      project_data: invitation.project.project_data,
    } : null,
    template_pesan: invitation.template_pesan ? {
      id: invitation.template_pesan.id,
      nama_template: invitation.template_pesan.nama_template,
      isi_pesan: invitation.template_pesan.isi_pesan,
    } : null,
    createdAt: invitation.createdAt,
    updatedAt: invitation.updatedAt,
  };
};

// ================================================================================
// CRUD OPERATIONS
// ================================================================================

export async function GetDataList(
  pagination = {},
  filter = {},
  sortString,
  includeOptions = []
) {
  const Project = (await import('./project.js')).default;
  const TemplatePesan = (await import('./template_pesan.js')).default;
  const Template = (await import('./template.js')).default;
  const limit = Number(pagination?.limit) || 10;
  const page = Number(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter?.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${filter.search}%` } },
      { owner_1: { [Op.iLike]: `%${filter.search}%` } },
      { owner_2: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }
  
  if (filter?.status) {
    where.status = filter.status;
  }

  const ALLOWED_SORT_FIELDS = new Set([
    "id",
    "name",
    "acara",
    "status",
    "createdAt",
  ]);
  let order = [["createdAt", "DESC"]]; // Urutan default

  // 3. Logika parsing & validasi string sort
  if (sortString && typeof sortString === "string") {
    const [field, direction] = sortString.split(":");
    const normalizedDirection = (direction || "").toUpperCase();
    if (ALLOWED_SORT_FIELDS.has(field) && ["ASC", "DESC"].includes(normalizedDirection)) {
      order = [[field, normalizedDirection]];
    }
  }

  // --- BAGIAN INI DIPINDAHKAN KELUAR DARI BLOK 'IF' ---
  const include = [
    {
      model: Project,
      as: "project",
      where: filter?.created_by ? { created_by: filter.created_by } : undefined,
      required: !!filter?.created_by,
      include: [
        {
          model: Template,
          as: "template",
          where: filter?.category_id ? { category_id: filter.category_id } : undefined,
          required: !!filter?.category_id,
        },
      ],
    },
    {
      model: TemplatePesan,
      as: "template_pesan",
    },
    ...includeOptions,
  ];

  const { rows, count } = await Invitation.findAndCountAll({
    where,
    limit,
    offset,
    include: include,
    distinct: true,
    order: order,
  });

  return {
    data: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
  // --- KURUNG KURAWAL YANG SALAH TELAH DIHAPUS DARI SINI ---
}

export async function CreateData(data, trx) {
  const Project = (await import('./project.js')).default;
  const TemplatePesan = (await import('./template_pesan.js')).default;

  const invitation = await Invitation.create(data, { transaction: trx });
  if (!invitation) throw new Error('Invitation creation failed');

  // Fetch with associations
  const completeInvitation = await Invitation.findByPk(invitation.id, {
    transaction: trx,
    include: [
      { model: Project, as: "project", attributes: ["id", "project_data"] },
      { model: TemplatePesan, as: "template_pesan", attributes: ["id", "nama_template", "isi_pesan"] },
    ],
  });

  return completeInvitation;
}

export async function GetDataById(id, includeOptions = []) {
  const Project = (await import('./project.js')).default;
  const TemplatePesan = (await import('./template_pesan.js')).default;

  return await Invitation.findByPk(id, {
    include: [
      { model: Project, as: "project" },
      { model: TemplatePesan, as: "template_pesan" },
      ...includeOptions,
    ],
  });
}

export async function UpdateData(trx, id, data) {
  const invitation = await Invitation.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  
  if (!invitation) throw new Error("Invitation not found");
  await invitation.update(data, { transaction: trx });
  return invitation;
}

export async function DeleteData(trx, id) {
  const invitation = await Invitation.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE,
  });
  
  if (!invitation) throw new Error("Invitation not found");
  await invitation.destroy({ force: true, transaction: trx });
  return { message: "Invitation deleted successfully" };
}


//         model: TemplatePesan,
//         as: "template_pesan",
//         attributes: ["id", "nama_template", "isi_pesan"],
//       },
//     ],
//   });

//   return invitation; // <--- Sekarang mengembalikan data yang sudah lengkap
// }

// /**
//  * Menghapus undangan berdasarkan ID.
//  * @param {number} id - ID Undangan.
//  * @param {import("sequelize").Transaction} trx - Transaksi database.
//  */
// export async function DeleteData(id, trx) {
//   const invitation = await Invitation.findByPk(id, {
//     transaction: trx,
//     lock: trx.LOCK.UPDATE,
//   });
//   if (!invitation) throw new Error("Undangan tidak ditemukan.");
//   await invitation.destroy({ transaction: trx });
//   return invitation;
// }
// models/invitation.js

// Tukar urutan parameter 'id' dan 'trx'
// export async function DeleteInvitation(id, trx) {
//   const item = await Invitation.findOne({
//     where: { id },
//     transaction: trx,
//     lock: trx?.LOCK?.UPDATE,
//   });
//   if (!item) throw new Error("Invitation not found");
//   await item.destroy({ force: true, transaction: trx });
//   return { message: "Invitation deleted successfully" };
// }

export default Invitation;
