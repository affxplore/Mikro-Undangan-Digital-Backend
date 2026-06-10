import { Sequelize, DataTypes, Op } from "sequelize";
import db from "../config/database.js";
import Invitation from "./invitation.js";
import ReceiveInv from "./receive_inv.js";

// ========================================
// UCAPAN TAMU MODEL - PURE SCHEMA
// ========================================
const UcapanTamu = db.define(
  "UcapanTamu",
  {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    invitation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Invitation ID tidak boleh kosong." }
      }
    },
    receive_inv_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Null jika ucapan anonim"
    },
    guest_name: { 
      type: DataTypes.STRING(100), 
      allowNull: false,
      validate: {
        notEmpty: { msg: "Nama tamu tidak boleh kosong." },
        len: {
          args: [2, 100],
          msg: "Nama tamu harus antara 2-100 karakter."
        }
      }
    },
    notes: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    attendance_status: {
      type: DataTypes.ENUM("tidak hadir", "hadir", "kapan kapan"),
      allowNull: false,
      validate: {
        isIn: {
          args: [["tidak hadir", "hadir", "kapan kapan"]],
          msg: "Status harus: tidak hadir, hadir, atau kapan kapan."
        }
      }
    },
  },
  {
    tableName: "ucapan_tamus",
    timestamps: true,
    freezeTableName: true,
    indexes: [
      { fields: ["invitation_id"] },
      { fields: ["receive_inv_id"] },
      { fields: ["attendance_status"] }
    ],
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
UcapanTamu.prototype.toJSON = function() {
  const values = { ...this.get() };
  
  // Format invitation jika ada
  if (values.invitation) {
    values.invitation = {
      id: values.invitation.id,
      name: values.invitation.name
    };
  }
  
  return values;
};

UcapanTamu.prototype.willAttend = function() {
  return this.attendance_status === 'hadir';
};

UcapanTamu.prototype.wontAttend = function() {
  return this.attendance_status === 'tidak hadir';
};

UcapanTamu.prototype.maybeLater = function() {
  return this.attendance_status === 'kapan kapan';
};

UcapanTamu.prototype.isAnonymous = function() {
  return !this.receive_inv_id;
};

// ========================================
// ASSOCIATIONS
// ========================================
  UcapanTamu.belongsTo(Invitation, {
    foreignKey: "invitation_id",
    as: "invitation",
  });
  
  UcapanTamu.belongsTo(ReceiveInv, { 
    foreignKey: "receive_inv_id", 
    as: "invited_guest" 
  });


// ========================================
// RESPONSE FORMATTER
// ========================================
export const ucapanTamuResponse = (ucapan) => {
  if (!ucapan) return null;
  return ucapan.toJSON ? ucapan.toJSON() : {
    id: ucapan.id,
    invitation_id: ucapan.invitation_id,
    receive_inv_id: ucapan.receive_inv_id,
    guest_name: ucapan.guest_name,
    notes: ucapan.notes,
    attendance_status: ucapan.attendance_status,
    createdAt: ucapan.createdAt,
    updatedAt: ucapan.updatedAt,
    invitation: ucapan.invitation ? {
      id: ucapan.invitation.id,
      name: ucapan.invitation.name,
    } : null,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar ucapan tamu dengan paginasi dan filter
 * @param {{page: number, limit: number}} pagination - Opsi paginasi
 * @param {{invitation_id?: number, search?: string, attendance_status?: string}} filter - Opsi filter
 * @param {Array} includeOptions - Opsi include untuk relasi
 */
export async function GetDataList(pagination, filter, includeOptions = []) {
  const { default: Invitation } = await import('./invitation.js');
  const { default: ReceiveInv } = await import('./receive_inv.js');
  
  const limit = Number(pagination?.limit) || 10;
  const page = Number(pagination?.page) || 1;
  const offset = (page - 1) * limit;
  const where = {};

  if (filter?.invitation_id) {
    where.invitation_id = filter.invitation_id;
  }
  if (filter?.search) {
    where.guest_name = { [Op.iLike]: `%${filter.search}%` };
  }
  if (filter?.attendance_status) {
    where.attendance_status = filter.attendance_status;
  }

  const defaultInclude = [
    {
      model: Invitation,
      as: 'invitation',
      attributes: ['id', 'name']
    },
    {
      model: ReceiveInv,
      as: 'invited_guest',
      attributes: ['id', 'recipient', 'email']
    }
  ];

  const { rows, count } = await UcapanTamu.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: includeOptions.length > 0 ? includeOptions : defaultInclude,
    distinct: true,
  });

  return {
    ucapanList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil ucapan tamu berdasarkan ID
 * @param {number} id - ID UcapanTamu
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  const { default: Invitation } = await import('./invitation.js');
  const { default: ReceiveInv } = await import('./receive_inv.js');
  
  return await UcapanTamu.findOne({
    where: { id },
    include: options.include !== false ? [
      {
        model: Invitation,
        as: 'invitation',
        attributes: ['id', 'name']
      },
      {
        model: ReceiveInv,
        as: 'invited_guest',
        attributes: ['id', 'recipient', 'email']
      }
    ] : undefined,
    ...options
  });
}

/**
 * Membuat ucapan tamu baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data ucapan tamu baru
 */
export async function CreateData(trx, data) {
  const item = await UcapanTamu.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat ucapan tamu.');
  return item;
}

/**
 * Memperbarui ucapan tamu berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID UcapanTamu
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateData(trx, id, data) {
  const item = await UcapanTamu.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error('Ucapan tamu tidak ditemukan.');
  await item.update(data, { transaction: trx });
  return item;
}

/**
 * Menghapus ucapan tamu berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID UcapanTamu
 */
export async function DeleteData(trx, id) {
  const item = await UcapanTamu.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error('Ucapan tamu tidak ditemukan.');
  await item.destroy({ force: true, transaction: trx });
  return { message: 'Ucapan tamu berhasil dihapus.' };
}

export default UcapanTamu;