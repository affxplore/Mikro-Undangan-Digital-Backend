import { Sequelize, DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// RECEIVE INV MODEL - PURE SCHEMA
// ========================================
const ReceiveInv = db.define(
  "ReceiveInv",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invitation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Invitation ID tidak boleh kosong." }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isValidEmail(value) {
          // Skip validasi jika null atau string kosong (optional field)
          if (value === null || value === undefined || value === '') return;
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new Error('Email tidak valid.');
          }
        }
      }
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Kode tidak boleh kosong." }
      }
    },
    recipient: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Nama penerima tidak boleh kosong." }
      }
    },
    phone_number: {
      type: DataTypes.STRING(15),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Nomor telepon tidak boleh kosong." }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'delivered', 'accepted'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'delivered', 'accepted']],
          msg: "Status harus: pending, delivered, atau accepted."
        }
      }
    },
  },
  {
    modelName: 'Receive_inv',
    tableName: "receive_invs",
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    indexes: [
      { fields: ["invitation_id"] },
      { fields: ["email"] },
      { fields: ["code"] },
      { fields: ["status"] }
    ],
  }
);

// ========================================
// INSTANCE METHODS
// ========================================
ReceiveInv.prototype.toJSON = function() {
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

ReceiveInv.prototype.isPending = function() {
  return this.status === 'pending';
};

ReceiveInv.prototype.isDelivered = function() {
  return this.status === 'delivered';
};

ReceiveInv.prototype.isAccepted = function() {
  return this.status === 'accepted';
};

ReceiveInv.prototype.markAsDelivered = async function(trx) {
  this.status = 'delivered';
  await this.save({ transaction: trx });
};

ReceiveInv.prototype.markAsAccepted = async function(trx) {
  this.status = 'accepted';
  await this.save({ transaction: trx });
};

// ========================================
// ASSOCIATIONS
// ========================================
ReceiveInv.associate = function(models) {
  ReceiveInv.belongsTo(models.Invitation, {
    foreignKey: "invitation_id",
    as: "invitation",
  });
  
  ReceiveInv.hasOne(models.UcapanTamu, {
    foreignKey: 'receive_inv_id',
    as: 'response'
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const receiveInvResponse = (receiveInv) => {
  if (!receiveInv) return null;
  return receiveInv.toJSON ? receiveInv.toJSON() : {
    id: receiveInv.id,
    invitation_id: receiveInv.invitation_id,
    code: receiveInv.code,
    recipient: receiveInv.recipient,
    phone_number: receiveInv.phone_number,
    email: receiveInv.email,
    status: receiveInv.status,
    createdAt: receiveInv.createdAt,
    updatedAt: receiveInv.updatedAt,
    invitation: receiveInv.invitation ? {
      id: receiveInv.invitation.id,
      name: receiveInv.invitation.name,
    } : null,
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Mengambil daftar receive inv dengan paginasi dan filter
 * @param {{page: number, limit: number, sort?: string}} pagination - Opsi paginasi
 * @param {{search?: string, invitation_id?: number, status?: string}} filter - Opsi filter
 */
export async function GetDataList(pagination, filter) {
  const { default: Invitation } = await import('./invitation.js');
  
  const limit = Number(pagination?.limit) || 10;
  const page = Number(pagination?.page) || 1;
  const offset = (page - 1) * limit;

  const where = {};
  if (filter?.search) {
    where[Op.or] = [
      { recipient: { [Op.iLike]: `%${filter.search}%` } },
      { phone_number: { [Op.iLike]: `%${filter.search}%` } },
      { email: { [Op.iLike]: `%${filter.search}%` } },
    ];
  }
  if (filter?.invitation_id) {
    where.invitation_id = filter.invitation_id;
  }
  if (filter?.status) {
    where.status = filter.status;
  }

  const { rows, count } = await ReceiveInv.findAndCountAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [{
      model: Invitation,
      as: 'invitation',
      attributes: ['id', 'name']
    }]
  });

  return {
    data: rows, //real brokk??
    // receiveInvList: rows,
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit),
  };
}

/**
 * Mengambil receive inv berdasarkan ID
 * @param {number} id - ID ReceiveInv
 * @param {object} options - Opsi query tambahan
 */
export async function GetDataById(id, options = {}) {
  const { default: Invitation } = await import('./invitation.js');
  
  return await ReceiveInv.findOne({
    where: { id },
    include: options.include !== false ? [{
      model: Invitation,
      as: 'invitation',
      attributes: ['id', 'name']
    }] : undefined,
    ...options
  });
}

/**
 * Mengambil receive inv berdasarkan code
 * @param {string} code - Kode undangan
 */
export async function GetByCode(code) {
  const { default: Invitation } = await import('./invitation.js');
  
  return await ReceiveInv.findOne({
    where: { code },
    include: [{
      model: Invitation,
      as: 'invitation'
    }]
  });
}

/**
 * Membuat receive inv baru
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {object} data - Data receive inv baru
 */
export async function CreateReceiveInv(trx, data) {
  const item = await ReceiveInv.create(data, { transaction: trx });
  if (!item) throw new Error('Gagal membuat receive inv.');
  return item;
}

/**
 * Memperbarui receive inv berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID ReceiveInv
 * @param {object} data - Data yang akan diupdate
 */
export async function UpdateReceiveInv(trx, id, data) {
  const item = await ReceiveInv.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error('Receive inv tidak ditemukan.');
  await item.update(data, { transaction: trx });
  return item;
}

/**
 * Menghapus receive inv berdasarkan ID
 * @param {import("sequelize").Transaction} trx - Transaksi database
 * @param {number} id - ID ReceiveInv
 */
export async function DeleteReceiveInv(trx, id) {
  const item = await ReceiveInv.findOne({
    where: { id },
    transaction: trx,
    lock: trx?.LOCK?.UPDATE
  });
  if (!item) throw new Error('Receive inv tidak ditemukan.');
  await item.destroy({ force: true, transaction: trx });
  return { message: 'Receive inv berhasil dihapus.' };
}

// export async function GetReceiveInvList(pagination, filter) {
//   const { default: Invitation } = await import('./invitation.js');
// }
//     // 'include' diletakkan di sini agar konsisten
//     include: [
//       {
//         model: Invitation,
//         as: "invitation",
//         attributes: ["id", "name"],
//       },
//     ],
//   });

//   return {
//     data: rows,
//     totalRows: count,
//     totalRowsInPage: rows.length,
//     currentPage: page,
//     totalPages: Math.ceil(count / limit),
//   };
// }

export async function CreateData(data, trx) {
  const { default: Invitation } = await import('./invitation.js'); // ← WAJIB: Invitation belum diimport di scope ini
  const newReceiveInv = await ReceiveInv.create(data, { transaction: trx });
  // Ambil kembali data yang baru dibuat dengan relasi
  return await ReceiveInv.findByPk(newReceiveInv.id, {
    transaction: trx,
    include: [
      { model: Invitation, as: "invitation", attributes: ["id", "name"] },
    ],
  });
}

export async function UpdateData(id, data, trx) {
  const receiveInv = await ReceiveInv.findByPk(id, {
    transaction: trx,
    lock: trx.LOCK.UPDATE,
  });
  if (!receiveInv) throw new Error("Penerima undangan tidak ditemukan.");
  await receiveInv.update(data, { transaction: trx });

  // Muat ulang data beserta relasinya
  await receiveInv.reload({
    transaction: trx,
    include: [
      { model: Invitation, as: "invitation", attributes: ["id", "name"] },
    ],
  });
  return receiveInv;
}

export async function DeleteData(id, trx) {
  const item = await ReceiveInv.findByPk(id, { transaction: trx });
  if (!item) throw new Error("Penerima undangan tidak ditemukan.");
  await item.destroy({ transaction: trx });
  // Kembalikan pesan sukses agar konsisten
  return { message: "Penerima undangan berhasil dihapus." };
}

export default ReceiveInv;

