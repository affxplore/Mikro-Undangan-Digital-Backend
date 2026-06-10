// models/systemMessage.js
import { DataTypes, Op } from "sequelize";
import db from "../config/database.js";

// ========================================
// SYSTEM MESSAGE MODEL - PURE SCHEMA
// ========================================
const SystemMessage = db.define("SystemMessage", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Content tidak boleh kosong." }
    }
  },
  type: {
    type: DataTypes.ENUM("info", "warning", "maintenance", "promo"),
    defaultValue: "info",
    validate: {
      isIn: {
        args: [["info", "warning", "maintenance", "promo"]],
        msg: "Type harus: info, warning, maintenance, atau promo."
      }
    }
  },
}, {
  modelName: 'System_message',
  tableName: "system_messages",
  underscored: true,
  timestamps: true,
  freezeTableName: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['created_at'] }
  ]
});

// ========================================
// INSTANCE METHODS
// ========================================
SystemMessage.prototype.toJSON = function() {
  return { ...this.get() };
};

SystemMessage.prototype.isInfo = function() {
  return this.type === 'info';
};

SystemMessage.prototype.isWarning = function() {
  return this.type === 'warning';
};

SystemMessage.prototype.isMaintenance = function() {
  return this.type === 'maintenance';
};

SystemMessage.prototype.isPromo = function() {
  return this.type === 'promo';
};

// ========================================
// ASSOCIATIONS
// ========================================
SystemMessage.associate = function(models) {
  SystemMessage.hasMany(models.UserNotification, { 
    foreignKey: "system_message_id",
    as: "notifications"
  });
};

// ========================================
// RESPONSE FORMATTER
// ========================================
export const systemMessageResponse = (msg) => {
  if (!msg) return null;
  return msg.toJSON ? msg.toJSON() : {
    id: msg.id,
    title: msg.title,
    content: msg.content,
    type: msg.type,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt
  };
};

// ========================================
// CRUD OPERATIONS
// ========================================

export const GetSystemMessageList = async ({ page = 1, limit = 10, type }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (type) where.type = type;
  
  const { rows, count } = await SystemMessage.findAndCountAll({
    where,
    offset,
    limit,
    order: [["createdAt", "DESC"]],
  });
  return { 
    list: rows, 
    totalRows: count,
    totalRowsInPage: rows.length,
    currentPage: page,
    totalPages: Math.ceil(count / limit)
  };
};

export const GetSystemMessageById = async (id) =>
  await SystemMessage.findByPk(id);

export const CreateSystemMessage = async (trx, payload) => {
  const item = await SystemMessage.create(payload, { transaction: trx });
  if (!item) throw new Error('Gagal membuat system message.');
  return item;
};

export const UpdateSystemMessage = async (trx, id, payload) => {
  const msg = await SystemMessage.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
  if (!msg) throw new Error("System message tidak ditemukan.");
  await msg.update(payload, { transaction: trx });
  return msg;
};

export const DeleteSystemMessage = async (trx, id) => {
  const msg = await SystemMessage.findByPk(id, { transaction: trx, lock: trx?.LOCK?.UPDATE });
  if (!msg) throw new Error("System message tidak ditemukan.");
  await msg.destroy({ transaction: trx });
  return { message: "System message berhasil dihapus." };
};

export default SystemMessage;
